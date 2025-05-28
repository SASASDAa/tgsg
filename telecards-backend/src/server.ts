
// telecards-backend/src/server.ts
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import http from 'http';
import cors from 'cors';
import apiRoutes from './routes'; // Main API router
import { setupWebSocketServer } from './websocket/webSocketServer';
import { CardDefinitionModel } from './models'; // For initializing card data
import { ALL_CARDS_POOL_BE_RAW } from './constants'; // Card definitions

const app = express();
const server = http.createServer(app);

// --- Middleware ---
// Enable CORS for all routes and origins (adjust for production)
app.use(cors() as RequestHandler);
// Parse JSON request bodies
app.use(express.json() as RequestHandler);
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }) as RequestHandler);


// --- Initialize Mock Data (Example for Card Definitions) ---
// This ensures CardDefinitionModel has data when the server starts.
if (ALL_CARDS_POOL_BE_RAW && CardDefinitionModel.loadDefinitions) {
  CardDefinitionModel.loadDefinitions(ALL_CARDS_POOL_BE_RAW);
} else {
  console.warn("Server: ALL_CARDS_POOL_BE_RAW not found or loadDefinitions missing. Card data might be empty.");
}
// Player data is initialized within PlayerModel.ts for this mock setup.


// --- API Routes ---
// All API routes will be prefixed with /api
app.use('/api', apiRoutes);

// Simple root route for testing if the server is up via HTTP
app.get('/', (req: Request, res: Response) => {
  res.send('TeleCards Backend is Alive!');
});


// --- Setup WebSocket Server ---
// The WebSocket server will attach to the existing HTTP server
setupWebSocketServer(server);


// --- Basic Error Handling Middleware ---
// This should be the last middleware added.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled API error:", err.stack);
  // Avoid sending stack trace to client in production
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});


// --- Start Server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TeleCards Backend Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is also running, attached to the HTTP server.`);
  console.log(`API routes available under /api`);
  console.log(`Matchmaking WebSocket at ws://localhost:${PORT}/ws/matchmaking`);
  console.log(`Challenge WebSocket at ws://localhost:${PORT}/ws/challenge`);
  // Game WebSocket path is dynamic, e.g., ws://localhost:${PORT}/ws/game/:gameId
});

export default server; // Optional: for testing or programmatic use
