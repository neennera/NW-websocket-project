const express = require('express');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const PORT = process.env.PORT || 3001;

// Import modules
const { initializeWebSocket } = require('./src/ws/handler');
const routes = require('./src/routes');

const app = express();
app.use(express.json());

// Mount routes
app.use('/', routes);

const authRoutes = require('./src/routes/auth.routes.js');
app.use('/auth', authRoutes);

// Create HTTP server for WebSocket upgrade
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API + WS server listening on port ${PORT}`);
});
