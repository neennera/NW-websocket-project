const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const {
  ensureRoom,
  broadcastRoom,
  removeMemberFromRoom,
  addMessageToRoom,
  getRoomMembers,
  getRoomMessages,
  getAllRooms,
} = require('./lib-rooms');

function handleMessage(ws, msg) {
  const { type } = msg;
  if (type === 'join') {
    const { room, username } = msg;
    const r = ensureRoom(room);
    r.members.set(ws.clientId, { username, ws });

    // send joined confirmation + current members and messages
    const members = getRoomMembers(room);
    const history = getRoomMessages(room);
    ws.send(JSON.stringify({ type: 'joined', room, members, history }));

    broadcastRoom(room, {
      type: 'member_joined',
      user: username,
      clientId: ws.clientId,
    });
  } else if (type === 'leave') {
    const { room } = msg;
    const member = removeMemberFromRoom(room, ws.clientId);
    if (member) {
      broadcastRoom(room, {
        type: 'member_left',
        user: member.username,
        clientId: ws.clientId,
      });
    }
  } else if (type === 'message') {
    const { room, text, sender } = msg;
    const m = { id: uuidv4(), sender, text, ts: Date.now() };
    addMessageToRoom(room, m);
    broadcastRoom(room, { type: 'message', message: m });
  } else if (type === 'list') {
    const { room } = msg;
    const members = getRoomMembers(room);
    const history = getRoomMessages(room);
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
      const allRooms = getAllRooms();
      for (const [roomName, room] of Object.entries(allRooms)) {
        if (room.members.has(clientId)) {
          const member = removeMemberFromRoom(roomName, clientId);
          broadcastRoom(roomName, {
            type: 'member_left',
            user: member.username,
            clientId,
          });
        }
      }
    });
  });

  // periodic ping
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
