// Cloudflare Worker — proxies AI photo-scan requests to Anthropic.
// Keeps the API key server-side so the GitHub Pages static build never
// ships it in the client bundle. Deploy with: npx wrangler deploy
// (run from this directory). Requires a Worker secret ANTHROPIC_API_KEY:
//   npx wrangler secret put ANTHROPIC_API_KEY

const ALLOWED_ORIGINS = new Set([
  'https://crazynoodl.github.io',
  'http://localhost:8081',
  'http://localhost:19006',
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: request.body,
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  },
};
