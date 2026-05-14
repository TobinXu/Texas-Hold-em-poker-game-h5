// Cloudflare Worker entry point
import { RoomDO } from './RoomDO';

export { RoomDO };

interface Env {
  ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      // Create room
      if (url.pathname === '/api/rooms' && request.method === 'POST') {
        const roomId = generateRoomId();
        // Create the DO which initializes room state
        const id = env.ROOM.idFromName(roomId);
        // Ping the DO to initialize it
        const stub = env.ROOM.get(id);
        await stub.fetch(new Request(`http://internal/state`));

        return new Response(JSON.stringify({ roomId }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get room info
      if (url.pathname.match(/^\/api\/rooms\/[A-Z0-9]+$/) && request.method === 'GET') {
        const roomId = url.pathname.split('/').pop()!;
        const id = env.ROOM.idFromName(roomId);
        const stub = env.ROOM.get(id);
        const response = await stub.fetch(new Request('http://internal/state'));

        return new Response(response.body, {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // WebSocket upgrade
      if (url.pathname.match(/^\/api\/ws\/[A-Z0-9]+$/)) {
        const roomId = url.pathname.split('/').pop()!;
        const id = env.ROOM.idFromName(roomId);
        const stub = env.ROOM.get(id);

        // Forward the WebSocket upgrade request to the DO
        return stub.fetch(request);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
