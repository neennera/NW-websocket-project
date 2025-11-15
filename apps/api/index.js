const express = require('express');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const PORT = process.env.PORT || 3001;

// Import modules
const { initializeWebSocket } = require('./src/ws/handler');
const routes = require('./src/routes');

const app = express();

// CORS middleware - ต้องอยู่ก่อน express.json()
// Support multiple origins for production and development
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the origin is in the allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (ALLOWED_ORIGINS.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Mount routes
app.use('/', routes);

// Import route files
const authRoutes = require('./src/routes/auth.routes.js');
const profileRoutes = require('./src/routes/profile.routes.js');
const groupRoutes = require('./src/routes/group.routes.js');
const featureRoutes = require('./src/routes/feature.routes.js');

// Use routes with /api prefix
app.use('/api/auth', authRoutes); // /api/auth/...
app.use('/api/profile', profileRoutes); // /api/profile/...
app.use('/api/groups', groupRoutes); // /api/groups/...
app.use('/api', featureRoutes); // /api/tags, /api/nicknames

// Create HTTP server for WebSocket upgrade
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API + WS server listening on port ${PORT}`);
});
