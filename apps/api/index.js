const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: __dirname + '/.env' });

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// In-memory structures for POC
const rooms = {}; // { roomName: { members: Map(clientId->{username, ws}), messages: [{id, sender, text, ts}] } }

function ensureRoom(room) {
  if (!rooms[room]) {
    rooms[room] = { members: new Map(), messages: [] };
  }
  return rooms[room];
}

const server = http.createServer(app);
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
    // remove from any rooms
    for (const [roomName, room] of Object.entries(rooms)) {
      if (room.members.has(clientId)) {
        const member = room.members.get(clientId);
        room.members.delete(clientId);
        broadcastRoom(roomName, {
          type: 'member_left',
          user: member.username,
          clientId,
        });
      }
    }
  });
});

function handleMessage(ws, msg) {
  const { type } = msg;
  if (type === 'join') {
    const { room, username } = msg;
    const r = ensureRoom(room);
    r.members.set(ws.clientId, { username, ws });

    // send joined confirmation + current members and messages
    const members = Array.from(r.members.entries()).map(([id, m]) => ({
      id,
      username: m.username,
    }));
    ws.send(
      JSON.stringify({ type: 'joined', room, members, history: r.messages })
    );

    broadcastRoom(room, {
      type: 'member_joined',
      user: username,
      clientId: ws.clientId,
    });
  } else if (type === 'leave') {
    const { room } = msg;
    const r = rooms[room];
    if (!r) return;
    const member = r.members.get(ws.clientId);
    if (member) {
      r.members.delete(ws.clientId);
      broadcastRoom(room, {
        type: 'member_left',
        user: member.username,
        clientId: ws.clientId,
      });
    }
  } else if (type === 'message') {
    const { room, text, sender } = msg;
    const r = ensureRoom(room);
    const m = { id: uuidv4(), sender, text, ts: Date.now() };
    r.messages.push(m);
    broadcastRoom(room, { type: 'message', message: m });
  } else if (type === 'list') {
    const { room } = msg;
    const r = rooms[room] || { members: new Map(), messages: [] };
    const members = Array.from(r.members.entries()).map(([id, m]) => ({
      id,
      username: m.username,
    }));
    ws.send(JSON.stringify({ type: 'list', members, history: r.messages }));
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'unknown_type' }));
  }
}

function broadcastRoom(room, payload) {
  const r = rooms[room];
  if (!r) return;
  const data = JSON.stringify(payload);
  for (const [id, m] of r.members) {
    try {
      m.ws.send(data);
    } catch (err) {
      console.error('send err', err);
    }
  }
}

// periodic ping
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`API + WS server listening on port ${PORT}`);
});
