const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const {
  addClientToRoom,
  removeClientFromRoom,
  broadcastToRoom,
  getRoomMembers,
  saveMessage,
  getRoomMessageHistory,
  getRoomInfo,
  isClientInRoom,
} = require('./lib-rooms');

// Map to store WebSocket connections by clientId
const wsConnections = new Map();

// Map to store online users: userId -> Set of clientIds
const onlineUsers = new Map();

// Export wsConnections for use in routes
function getWsConnections() {
  return wsConnections;
}

// Export function to get online users
function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

// Broadcast online users update to all home-tracking clients
function broadcastOnlineUsersUpdate() {
  const onlineUserIds = getOnlineUsers();
  console.log('📡 Broadcasting online users update:', onlineUserIds);

  const updateMessage = JSON.stringify({
    type: 'online_users_update',
    userIds: onlineUserIds
  });

  let broadcastCount = 0;
  // Send to all connected WebSocket clients
  wsConnections.forEach((clientWs, clientId) => {
    if (clientWs.readyState === 1) { // WebSocket.OPEN
      try {
        clientWs.send(updateMessage);
        broadcastCount++;
      } catch (err) {
        console.error(`Failed to send online users update to ${clientId}:`, err);
      }
    }
  });

  console.log(`📡 Broadcasted online users update to ${broadcastCount} clients`);
}

async function handleMessage(ws, msg) {
  const { type } = msg;
  console.log('📨 Received WebSocket message:', { type, ...msg });

  if (type === 'join') {
    const { roomId, username, userId } = msg;
    console.log('🔗 Processing join request:', { roomId, username, userId, clientId: ws.clientId });

    // Track online user
    if (userId) {
      // Ensure userId is an integer
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        console.error('❌ Invalid userId provided:', userId);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid userId' }));
        return;
      }

      ws.userId = userIdInt; // Store userId on WebSocket connection
      if (!onlineUsers.has(userIdInt)) {
        onlineUsers.set(userIdInt, new Set());
      }
      onlineUsers.get(userIdInt).add(ws.clientId);
      console.log(
        `✅ User ${userIdInt} (${username}) is now online. Total online users:`,
        onlineUsers.size,
        'Current online user IDs:', Array.from(onlineUsers.keys())
      );

      // Broadcast updated online users list
      broadcastOnlineUsersUpdate();
    } else {
      console.warn('⚠️ Join message missing userId:', msg);
    }

    // Handle special tracking rooms (like home-tracking) - don't add to DB
    if (roomId === 'home-tracking') {
      ws.send(JSON.stringify({
        type: 'joined',
        roomId,
        members: [],
        history: []
      }));

      // Broadcast updated online users list to all home-tracking clients
      broadcastOnlineUsersUpdate();
      return;
    }

    // Check if this is a new join or a refresh
    // by checking if client is already in the room
    const isNewJoin = !isClientInRoom(roomId, ws.clientId);

    // Add client to room
    await addClientToRoom(roomId, ws.clientId, username);

    // Get room info and message history from DB
    const members = await getRoomMembers(roomId);
    const history = await getRoomMessageHistory(roomId);

    // Send joined confirmation
    ws.send(JSON.stringify({ type: 'joined', roomId, members, history }));

    // Only broadcast member_joined if this is a NEW join (not a refresh)
    if (isNewJoin) {
      broadcastToRoom(
        roomId,
        {
          type: 'member_joined',
          user: username,
          clientId: ws.clientId,
        },
        wsConnections
      );
    }
  } else if (type === 'leave') {
    const { roomId } = msg;
    const client = await removeClientFromRoom(roomId, ws.clientId);
    if (client) {
      broadcastToRoom(
        roomId,
        {
          type: 'member_left',
          user: client.username,
          clientId: ws.clientId,
        },
        wsConnections
      );
    }
  } else if (type === 'message') {
    const { roomId, text, sender } = msg;

    console.log('Received message:', { roomId, text, sender });

    // Save message to database
    const savedMessage = await saveMessage(roomId, sender, text);

    console.log('Saved message:', savedMessage);

    if (savedMessage) {
      // Broadcast message to room
      broadcastToRoom(
        roomId,
        {
          type: 'message',
          message: savedMessage,
        },
        wsConnections
      );
    } else {
      console.error('Failed to save message');
      ws.send(
        JSON.stringify({ type: 'error', message: 'Failed to save message' })
      );
    }
  } else if (type === 'list') {
    const { roomId } = msg;
    const members = await getRoomMembers(roomId);
    const history = await getRoomMessageHistory(roomId);
    ws.send(JSON.stringify({ type: 'list', members, history }));
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'unknown_type' }));
  }
}

function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    ws.clientId = clientId;
    ws.isAlive = true;

    // Store WebSocket connection
    wsConnections.set(clientId, ws);

    console.log(`🔌 Client ${clientId} connected from ${req.socket.remoteAddress}`);
    console.log(`📊 Current connections: ${wsConnections.size}, Online users: ${onlineUsers.size}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(ws, msg);
      } catch (err) {
        console.error('Invalid message', err);
        ws.send(JSON.stringify({ type: 'error', message: 'invalid_message' }));
      }
    });

    ws.on('close', () => {
      console.log(`🔌 Client ${clientId} disconnected`);

      // Remove from online users tracking
      if (ws.userId) {
        const userClients = onlineUsers.get(ws.userId);
        if (userClients) {
          userClients.delete(clientId);
          if (userClients.size === 0) {
            onlineUsers.delete(ws.userId);
            console.log(
              `❌ User ${ws.userId} went offline. Total online users:`,
              onlineUsers.size,
              'Remaining online user IDs:', Array.from(onlineUsers.keys())
            );

            // Broadcast updated online users list
            broadcastOnlineUsersUpdate();
          } else {
            console.log(
              `🔗 User ${ws.userId} still has ${userClients.size} other connections`
            );
          }
        }
      }
      // Remove client connection
      wsConnections.delete(clientId);
      console.log(`📊 Current connections: ${wsConnections.size}, Online users: ${onlineUsers.size}`);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for ${clientId}:`, err);
    });
  });

  // periodic ping to keep connections alive
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return wss;
}

module.exports = { initializeWebSocket, getWsConnections, getOnlineUsers };
