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

// Export wsConnections for use in routes
function getWsConnections() {
  return wsConnections;
}

async function handleMessage(ws, msg) {
  const { type } = msg;

  if (type === 'join') {
    const { roomId, username } = msg;

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

    console.log(`Client ${clientId} connected`);

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
      // Remove client connection
      wsConnections.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
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

module.exports = { initializeWebSocket, getWsConnections };
