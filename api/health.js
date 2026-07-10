const { json, findEnv } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Método não permitido.' });
  const checks = {
    MP_ACCESS_TOKEN: Boolean(findEnv('MP_ACCESS_TOKEN')),
    SUPABASE_URL: Boolean(findEnv('SUPABASE_URL')),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(findEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_ROLE', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY'])),
    MP_WEBHOOK_SECRET: Boolean(findEnv('MP_WEBHOOK_SECRET')),
    SITE_URL: Boolean(findEnv('SITE_URL'))
  };
  return json(res, 200, {
    ok: checks.MP_ACCESS_TOKEN && checks.SUPABASE_URL && checks.SUPABASE_SERVICE_ROLE_KEY,
    version: '56.4',
    checks
  });
};
