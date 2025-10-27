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

// Import route files
const authRoutes = require('./src/routes/auth.routes.js');
const profileRoutes = require('./src/routes/profile.routes.js');
const groupRoutes = require('./src/routes/group.routes.js');
const featureRoutes = require('./src/routes/feature.routes.js');

// Use routes
app.use('/auth', authRoutes);       // /auth/...
app.use('/profile', profileRoutes); // /profile/...
app.use('/groups', groupRoutes);    // /groups/...
app.use('/', featureRoutes);        // /tags, /nicknames

// Create HTTP server for WebSocket upgrade
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API + WS server listening on port ${PORT}`);
});
