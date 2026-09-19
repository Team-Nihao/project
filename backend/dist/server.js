"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const seedData_1 = require("./db/seedData");
const campusRoutes_1 = __importDefault(require("./routes/campusRoutes"));
const issuesRoutes_1 = require("./routes/issuesRoutes");
const eventsRoutes_1 = require("./routes/eventsRoutes");
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const simulationRoutes_1 = require("./routes/simulationRoutes");
const chatbotRoutes_1 = __importDefault(require("./routes/chatbotRoutes"));
const iotSimulator_1 = require("./services/iotSimulator");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 4000;
// Enable CORS for frontend Vite dev server (port 5173) and any origin
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express_1.default.json());
// Initialize Socket.IO with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Initialize database schema
(0, database_1.initDatabase)();
// Auto-seed if database is empty
try {
    const countRow = database_1.db.prepare('SELECT count(*) as count FROM buildings').get();
    if (!countRow || countRow.count === 0) {
        console.log('[Database] Empty database detected. Seeding default campus digital twin data...');
        (0, seedData_1.seedDatabase)();
    }
}
catch (err) {
    console.warn('[Database] Auto-seed check warning:', err);
}
// Instantiate IoT Simulation Engine
const simulator = new iotSimulator_1.IoTSimulator(io);
// Mount API routes
app.use('/api/campus', campusRoutes_1.default);
app.use('/api/issues', (0, issuesRoutes_1.createIssuesRouter)(io));
app.use('/api/events', (0, eventsRoutes_1.createEventsRouter)(io));
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/simulation', (0, simulationRoutes_1.createSimulationRouter)(simulator));
app.use('/api/chatbot', chatbotRoutes_1.default);
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
