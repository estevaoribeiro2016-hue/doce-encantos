const STORE_ADDRESS = 'Rua Aletes, 78, Pindorama, Belo Horizonte, MG, 30865-180, Brasil';
// Coordenada aproximada da loja. Usar coordenada fixa evita a API localizar a loja em outra cidade.
const STORE_COORDS = [-44.0019, -19.9129]; // [lng, lat] - Pindorama/BH
const MAX_REASONABLE_KM = 30;
// Em bairros próximos, a rota da API às vezes dá volta grande ou localiza o trajeto errado.
// Para evitar cobrar frete errado, usamos uma distância operacional mais conservadora:
// se a rota vier muito maior que a linha reta, consideramos a linha reta com margem de rua.
function operationalDistanceKm(routeKm, straightKm) {
  const adjustedStraight = straightKm * 1.35;
  if (routeKm > 2.5 && straightKm <= 2 && routeKm > adjustedStraight * 1.7) {
    return adjustedStraight;
  }
  if (routeKm > 4 && straightKm <= 3 && routeKm > adjustedStraight * 1.8) {
    return adjustedStraight;
  }
  return routeKm;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

function normalizeDestination(text) {
  return String(text || '')
    .replace(/Belo Horizonte\s*\/\s*MG/gi, 'Belo Horizonte, Minas Gerais')
    .replace(/CEP/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function geocodeDestination(address, apiKey) {
  const normalized = normalizeDestination(address);
  const attempts = [
    normalized,
    `${normalized}, Belo Horizonte, Minas Gerais, Brasil`,
  ];

  let best = null;
  for (const text of attempts) {
    const url = new URL('https://api.openrouteservice.org/geocode/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('text', text);
    url.searchParams.set('boundary.country', 'BR');
    // Força a busca para perto da loja, evitando resultado em outra cidade/estado.
    url.searchParams.set('focus.point.lon', String(STORE_COORDS[0]));
    url.searchParams.set('focus.point.lat', String(STORE_COORDS[1]));
    url.searchParams.set('boundary.circle.lon', String(STORE_COORDS[0]));
    url.searchParams.set('boundary.circle.lat', String(STORE_COORDS[1]));
    url.searchParams.set('boundary.circle.radius', '25');
    url.searchParams.set('layers', 'address,street,venue,locality');
    url.searchParams.set('size', '5');

    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const features = Array.isArray(data.features) ? data.features : [];

    for (const feature of features) {
      const coords = feature?.geometry?.coordinates;
      if (!coords) continue;
      const kmStraight = haversineKm(STORE_COORDS, coords);
      if (kmStraight > MAX_REASONABLE_KM) continue;
      if (!best || kmStraight < best.kmStraight) best = { coords, kmStraight, label: feature.properties?.label || text };
    }
    if (best) break;
  }

  if (!best) throw new Error('Não consegui localizar esse endereço perto da loja. Confira CEP, rua, número e bairro.');
  return best;
}

async function routeDistance(origin, destination, apiKey) {
  const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates: [origin, destination] }),
  });
  if (!res.ok) throw new Error('Falha ao calcular rota');
  const data = await res.json();
  const summary = data.features?.[0]?.properties?.summary;
  if (!summary) throw new Error('Rota não encontrada');
  const distanceKm = summary.distance / 1000;
  if (distanceKm > MAX_REASONABLE_KM) {
    throw new Error('A API retornou uma distância incompatível com a região da loja. Confira o endereço.');
  }
  return {
    distanceKm,
    durationMin: summary.duration / 60,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTESERVICE_API_KEY não configurada na Vercel' });
    return;
  }

  try {
    const { destination } = req.body || {};
    if (!destination) {
      res.status(400).json({ error: 'Destino obrigatório' });
      return;
    }

    const found = await geocodeDestination(destination, apiKey);
    const route = await routeDistance(STORE_COORDS, found.coords, apiKey);
    const operationalKm = operationalDistanceKm(route.distanceKm, found.kmStraight);
    const fee = operationalKm <= 2 ? 5 : 10;

    res.status(200).json({
      storeAddress: STORE_ADDRESS,
      destination,
      matchedAddress: found.label,
      routeDistanceKm: Number(route.distanceKm.toFixed(2)),
      straightDistanceKm: Number(found.kmStraight.toFixed(2)),
      distanceKm: Number(operationalKm.toFixed(2)),
      durationMin: Math.round(route.durationMin),
      fee,
      distanceMode: operationalKm !== route.distanceKm ? 'ajustada' : 'rota',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao calcular distância' });
  }
};
