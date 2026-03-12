/**
 * OTA Signal — Schedules Direct API Proxy
 * Deploy this as a Cloudflare Worker at: https://dash.cloudflare.com
 *
 * Steps:
 *  1. Sign up free at cloudflare.com
 *  2. Go to Workers & Pages → Create → Create Worker
 *  3. Paste this entire file, click Deploy
 *  4. Copy the worker URL (e.g. https://sd-proxy.yourname.workers.dev)
 *  5. Paste that URL into index.html where it says YOUR-SUBDOMAIN
 */

const SD_BASE = 'https://json.schedulesdirect.org/20141201';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405, headers: CORS_HEADERS,
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    const { endpoint, method = 'GET', body: reqBody, token, params } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    let url = `${SD_BASE}/${endpoint}`;
    if (params && Object.keys(params).length) {
      url += '?' + new URLSearchParams(params).toString();
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['token'] = token;

    const fetchOpts = { method, headers };
    if (reqBody && method !== 'GET') {
      fetchOpts.body = JSON.stringify(reqBody);
    }

    try {
      const sdRes = await fetch(url, fetchOpts);
      const text = await sdRes.text();

      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      return new Response(JSON.stringify(data), {
        status: sdRes.status,
        headers: CORS_HEADERS,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: CORS_HEADERS,
      });
    }
  },
};
