const { json } = require('./_shared');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Método não permitido.' });
  const checks = ['MP_ACCESS_TOKEN','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','MP_WEBHOOK_SECRET'].reduce((a,k)=>(a[k]=!!process.env[k],a),{});
  return json(res, 200, { ok: checks.MP_ACCESS_TOKEN && checks.SUPABASE_URL && checks.SUPABASE_SERVICE_ROLE_KEY, version: '56.7', checks });
};
