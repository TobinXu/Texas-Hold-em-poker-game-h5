import { RoomDO } from './RoomDO';

export { RoomDO };

interface Env {
  ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve static assets (frontend)
    // Try ASSETS binding first (Cloudflare Pages / Workers Sites)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    // SPA fallback: serve index.html for client-side routing
    if (env.ASSETS) {
      const indexRequest = new Request(new URL('/index.html', url.origin).toString());
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      if (indexResponse.status !== 404) {
        return new Response(indexResponse.body, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleAPI(request: Request, env: Env, url: URL): Promise<Response> {
  // Create room
  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    const roomId = generateRoomId();
    const id = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(id);
    await stub.fetch(new Request('http://internal/state'));

    return new Response(JSON.stringify({ roomId }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Get room info
  const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)$/);
  if (roomMatch && request.method === 'GET') {
    const roomId = roomMatch[1];
    const id = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(id);
    const response = await stub.fetch(new Request('http://internal/state'));

    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // WebSocket upgrade
  const wsMatch = url.pathname.match(/^\/api\/ws\/([A-Z0-9]+)$/);
  if (wsMatch) {
    const roomId = wsMatch[1];
    const id = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(id);
    // Rewrite path to /ws for RoomDO handler
    const wsUrl = new URL(request.url);
    wsUrl.pathname = '/ws';
    return stub.fetch(new Request(wsUrl.toString(), request));
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
