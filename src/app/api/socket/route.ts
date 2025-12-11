import { initializeSocket } from '@/lib/websocket/server';
import { setupMatchNamespace } from '@/lib/websocket/namespaces/matches';
import { setupNotificationsNamespace } from '@/lib/websocket/namespaces/notifications';
import { setupTeamsNamespace } from '@/lib/websocket/namespaces/teams';

export async function GET(request: Request) {
  // Initialize Socket.io server on first request
  const io = await initializeSocket(request);

  // Setup namespaces
  setupMatchNamespace();
  setupNotificationsNamespace();
  setupTeamsNamespace();

  return new Response('Socket.io initialized', { status: 200 });
}
