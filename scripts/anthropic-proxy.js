// Local CORS proxy for Anthropic API — dev only
// Usage: node scripts/anthropic-proxy.js
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env
try {
  const content = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
} catch (_) {}

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const PORT = 3001;

if (!API_KEY) {
  console.error('❌  EXPO_PUBLIC_ANTHROPIC_API_KEY not found in .env');
  process.exit(1);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, CORS);
    res.end();
    return;
  }

  try {
    // Collect body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Forward to Anthropic using built-in fetch (Node 18+)
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    const text = await upstream.text();
    console.log(`→ ${upstream.status} (${text.length} bytes)`);

    res.writeHead(upstream.status, {
      'Content-Type': 'application/json',
      ...CORS,
    });
    res.end(text);
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.writeHead(500, { 'Content-Type': 'application/json', ...CORS });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`✅  Anthropic CORS proxy → http://localhost:${PORT}`);
  console.log('   Keep this running alongside: npx expo start');
});
