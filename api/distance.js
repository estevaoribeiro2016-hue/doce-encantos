const STORE_ADDRESS = 'Rua Aletes, 78, Pindorama, Belo Horizonte, MG, 30865-180, Brasil';
// Coordenada aproximada da loja. Usar coordenada fixa evita a API localizar a loja em outra cidade.
const STORE_COORDS = [-44.0019, -19.9129]; // [lng, lat] - Pindorama/BH
const MAX_REASONABLE_KM = 30;

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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
    .replace(/Brasil/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// V37: correção operacional para endereços muito próximos da loja.
// Algumas APIs localizam Rua Arauto / Pindorama com rota longa, mesmo sendo 190 m no mapa.
// Para evitar frete errado, endereços do Pindorama/CEP 30865 próximos da loja entram como área local.
function localOperationalDistance(destination) {
  const t = normalizeText(destination);
  const isBH = t.includes('belo horizonte') || t.includes('mg') || t.includes('minas gerais');
  const isPindorama = t.includes('pindorama');
  const isLocalCep = /30865[-\s]?\d{3}/.test(t) || t.includes('30865');

  if (!(isBH && (isPindorama || isLocalCep))) return null;

  // Ajustes finos para ruas conhecidas próximas à loja.
  const known = [
    { street: 'rua arauto', km: 0.2, label: 'área local: Rua Arauto / Pindorama' },
    { street: 'r arauto', km: 0.2, label: 'área local: Rua Arauto / Pindorama' },
    { street: 'rua aletes', km: 0.1, label: 'área local: Rua Aletes / Pindorama' },
    { street: 'r aletes', km: 0.1, label: 'área local: Rua Aletes / Pindorama' },
    { street: 'rua araguari', km: 0.9, label: 'área local: Rua Araguari / Pindorama' },
    { street: 'r araguari', km: 0.9, label: 'área local: Rua Araguari / Pindorama' },
    { street: 'rua juruena', km: 0.8, label: 'área local: Rua Juruena / Pindorama' },
    { street: 'r juruena', km: 0.8, label: 'área local: Rua Juruena / Pindorama' },
    { street: 'rua aricanduva', km: 1.0, label: 'área local: Rua Aricanduva / Pindorama' },
    { street: 'r aricanduva', km: 1.0, label: 'área local: Rua Aricanduva / Pindorama' },
  ];

  const match = known.find((x) => t.includes(x.street));
  if (match) return { km: match.km, label: match.label };

  // Fallback para o bairro/CEP local: considera como até 2 km, para nunca cobrar R$10 por erro da rota.
  return { km: 1.5, label: 'área local Pindorama/CEP 30865' };
}

function operationalDistanceKm(destination, routeKm, straightKm) {
  const local = localOperationalDistance(destination);
  if (local) {
    return {
      km: local.km,
      mode: 'area_local',
      note: local.label,
    };
  }

  const adjustedStraight = straightKm * 1.35;
  if (routeKm > 2.5 && straightKm <= 2 && routeKm > adjustedStraight * 1.7) {
    return { km: adjustedStraight, mode: 'ajustada', note: 'rota incompatível; distância ajustada por linha reta' };
  }
  if (routeKm > 4 && straightKm <= 3 && routeKm > adjustedStraight * 1.8) {
    return { km: adjustedStraight, mode: 'ajustada', note: 'rota incompatível; distância ajustada por linha reta' };
  }
  return { km: routeKm, mode: 'rota', note: 'distância por rota' };
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

    // Primeiro verifica se é área local conhecida. Isso evita casos como Rua Arauto 120 virar 3,8 km.
    const local = localOperationalDistance(destination);
    if (local) {
      const fee = local.km <= 2 ? 5 : 10;
      res.status(200).json({
        storeAddress: STORE_ADDRESS,
        destination,
        matchedAddress: local.label,
        routeDistanceKm: null,
        straightDistanceKm: null,
        distanceKm: Number(local.km.toFixed(2)),
        durationMin: Math.max(1, Math.round(local.km / 0.2)),
        fee,
        distanceMode: 'area_local',
        note: 'Endereço reconhecido como área próxima da loja. Distância operacional corrigida para evitar frete errado.',
      });
      return;
    }

    const found = await geocodeDestination(destination, apiKey);
    const route = await routeDistance(STORE_COORDS, found.coords, apiKey);
    const op = operationalDistanceKm(destination, route.distanceKm, found.kmStraight);
    const fee = op.km <= 2 ? 5 : 10;

    res.status(200).json({
      storeAddress: STORE_ADDRESS,
      destination,
      matchedAddress: found.label,
      routeDistanceKm: Number(route.distanceKm.toFixed(2)),
      straightDistanceKm: Number(found.kmStraight.toFixed(2)),
      distanceKm: Number(op.km.toFixed(2)),
      durationMin: Math.round(route.durationMin),
      fee,
      distanceMode: op.mode,
      note: op.note,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao calcular distância' });
  }
};
