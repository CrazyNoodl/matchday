const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Load .env so the proxy middleware can read the Anthropic key
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
} catch (_) {}

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Anthropic proxy at /api/anthropic — same origin as Metro (no CORS)
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url !== '/api/anthropic') return middleware(req, res, next);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      res.end();
      return;
    }

    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks);
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
          },
          body,
        });
        const text = await upstream.text();
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
        res.end(text);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  };
};

module.exports = config;
