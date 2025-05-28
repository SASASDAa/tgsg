import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { handleNewMatchmakingConnection } from './matchmakingHandler';
import { handleNewChallengeConnection } // Assuming you'll create this
// from './challengeHandler';

export function setupWebSocketServer(server: http.Server) {
  const wssMatchmaking = new WebSocketServer({ noServer: true });
  const wssGame = new WebSocketServer({ noServer: true }); // For active game sessions
  const wssChallenge = new WebSocketServer({ noServer: true }); // For friend challenges

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;

    if (pathname === '/ws/matchmaking') {
      wssMatchmaking.handleUpgrade(request, socket, head, (ws) => {
        wssMatchmaking.emit('connection', ws, request);
      });
    } else if (pathname && pathname.startsWith('/ws/game/')) { // Example: /ws/game/gameId123
      // This path would typically be established *after* a match is found.
      // The GameSession itself might handle the WebSocket connection directly once established.
      // Or, you route to a specific GameSession's WebSocket handler.
      wssGame.handleUpgrade(request, socket, head, (ws) => {
        wssGame.emit('connection', ws, request); // GameSession manager would pick this up
      });
    } else if (pathname === '/ws/challenge') {
       wssChallenge.handleUpgrade(request, socket, head, (ws) => {
        wssChallenge.emit('connection', ws, request);
      });
    } else {
      console.log(`WebSocket: Unknown path ${pathname}, destroying socket.`);
      socket.destroy();
    }
  });

  wssMatchmaking.on('connection', (ws, request) => {
    console.log('WebSocket: Client connected to matchmaking.');
    // Extract userId, rating, etc. from request (e.g., query params or auth token in headers)
    // For example: const userId = new URL(request.url!, `http://${request.headers.host}`).searchParams.get('userId');
    const tempUserId = `user_mm_${Date.now().toString().slice(-4)}`; // Placeholder
    handleNewMatchmakingConnection(ws, tempUserId /*, userRating, userDeckId */);
  });

  wssGame.on('connection', (ws, request) => {
    const gameId = request.url?.split('/').pop(); // simplistic gameId extraction
    console.log(`WebSocket: Client connected to game session ${gameId}.`);
    // Here, you would associate this ws connection with an existing GameSession instance.
    // This part requires a GameSessionManager to look up the session by gameId
    // and pass the ws connection to it.
    // For now, just log.
     ws.send(JSON.stringify({type: "INFO", payload: `Connected to game instance placeholder ${gameId}`}));
     ws.on('message', (message) => {
        console.log(`Game (${gameId}) received: ${message}`);
        // GameSession instance would handle this
     });
  });
  
  wssChallenge.on('connection', (ws, request) => {
    console.log('WebSocket: Client connected for challenges.');
    const tempUserId = `user_ch_${Date.now().toString().slice(-4)}`; // Placeholder
    // Pass to challengeHandler
    if (handleNewChallengeConnection) { // Check if function exists
        handleNewChallengeConnection(ws, tempUserId);
    } else {
        ws.send(JSON.stringify({type: "ERROR", payload: "Challenge system not fully implemented."}));
        ws.close();
    }
  });


  console.log('WebSocket server configured.');
}
