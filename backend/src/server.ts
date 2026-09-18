import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import campusRoutes from './routes/campusRoutes';
import { createIssuesRouter } from './routes/issuesRoutes';
import { createEventsRouter } from './routes/eventsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { createSimulationRouter } from './routes/simulationRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import { IoTSimulator } from './services/iotSimulator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend Vite dev server (port 5173) and any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize database schema
initDatabase();

// Instantiate IoT Simulation Engine
const simulator = new IoTSimulator(io);

// Mount API routes
app.use('/api/campus', campusRoutes);
app.use('/api/issues', createIssuesRouter(io));
app.use('/api/events', createEventsRouter(io));
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulation', createSimulationRouter(simulator));
app.use('/api/chatbot', chatbotRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Campus Digital Twin Backend & IoT Stream',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO event listeners
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send immediate simulation status on connect
  socket.emit('simulation:status', simulator.getStatus());

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start IoT simulator
simulator.start();

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Campus Digital Twin Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server listening for real-time telemetry`);
  console.log(`⚡ API endpoints available at http://localhost:${PORT}/api/campus/state`);
  console.log(`====================================================`);
});

