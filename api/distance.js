const STORE_ADDRESS = 'Rua Aletes, 78, Pindorama, Belo Horizonte, MG, 30865-180, Brasil';

async function geocode(address, apiKey) {
  const url = new URL('https://api.openrouteservice.org/geocode/search');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('text', address);
  url.searchParams.set('boundary.country', 'BR');
  url.searchParams.set('size', '1');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao localizar endereço');
  const data = await res.json();
  const feature = data.features && data.features[0];
  if (!feature || !feature.geometry || !feature.geometry.coordinates) {
    throw new Error('Endereço não encontrado');
  }
  return feature.geometry.coordinates; // [lng, lat]
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
  return {
    distanceKm: summary.distance / 1000,
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

    const originCoords = await geocode(STORE_ADDRESS, apiKey);
    const destCoords = await geocode(`${destination}, Brasil`, apiKey);
    const route = await routeDistance(originCoords, destCoords, apiKey);
    const fee = route.distanceKm <= 2 ? 5 : 10;

    res.status(200).json({
      storeAddress: STORE_ADDRESS,
      destination,
      distanceKm: Number(route.distanceKm.toFixed(2)),
      durationMin: Math.round(route.durationMin),
      fee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao calcular distância' });
  }
};
