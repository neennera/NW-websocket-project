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
} = require('./lib-rooms');

// Map to store WebSocket connections by clientId
const wsConnections = new Map();

async function handleMessage(ws, msg) {
  const { type } = msg;

  if (type === 'join') {
    const { room, username } = msg;

    // Add client to room
    await addClientToRoom(room, ws.clientId, username);

    // Get room info and message history from DB
    const members = getRoomMembers(room);
    const history = await getRoomMessageHistory(room);

    // Send joined confirmation
    ws.send(JSON.stringify({ type: 'joined', room, members, history }));

    // Broadcast member_joined to other clients
    broadcastToRoom(
      room,
      {
        type: 'member_joined',
        user: username,
        clientId: ws.clientId,
      },
      wsConnections
    );
  } else if (type === 'leave') {
    const { room } = msg;
    const client = await removeClientFromRoom(room, ws.clientId);
    if (client) {
      broadcastToRoom(
        room,
        {
          type: 'member_left',
          user: client.username,
          clientId: ws.clientId,
        },
        wsConnections
      );
    }
  } else if (type === 'message') {
    const { room, text, sender } = msg;

    // Save message to database
    const savedMessage = await saveMessage(room, sender, text);

    if (savedMessage) {
      // Broadcast message to room
      broadcastToRoom(
        room,
        {
          type: 'message',
          message: savedMessage,
        },
        wsConnections
      );
    } else {
      ws.send(
        JSON.stringify({ type: 'error', message: 'Failed to save message' })
      );
    }
  } else if (type === 'list') {
    const { room } = msg;
    const members = getRoomMembers(room);
    const history = await getRoomMessageHistory(room);
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

module.exports = { initializeWebSocket };
