const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const activeConnections = {};

async function addClientToRoom(roomId, clientId, username) {
  if (!activeConnections[roomId]) {
    activeConnections[roomId] = new Map();
  }
  activeConnections[roomId].set(clientId, { username });
  return { clientId, username };
}

async function removeClientFromRoom(roomId, clientId) {
  if (!activeConnections[roomId]) return null;
  const client = activeConnections[roomId].get(clientId);
  if (client) {
    activeConnections[roomId].delete(clientId);
    if (activeConnections[roomId].size === 0) {
      delete activeConnections[roomId];
    }
  }
  return client || null;
}

function broadcastToRoom(roomId, payload, wsConnections) {
  if (!activeConnections[roomId]) return;
  const data = JSON.stringify(payload);
  for (const [clientId, _] of activeConnections[roomId]) {
    const ws = wsConnections.get(clientId);
    if (ws && ws.readyState === 1) {
      ws.send(data);
    }
  }
}

function getRoomMembers(roomId) {
  if (!activeConnections[roomId]) return [];
  return Array.from(activeConnections[roomId].entries()).map(
    ([id, client]) => ({
      id,
      username: client.username,
    })
  );
}

async function saveMessage(roomId, sender, text) {
  const message = await prisma.message.create({
    data: {
      text,
      groupId: roomId,
    },
  });
  return {
    id: message.id,
    sender,
    text: message.text,
    ts: message.createdAt.getTime(),
  };
}

async function getRoomMessageHistory(roomId) {
  const messages = await prisma.message.findMany({
    where: { groupId: roomId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      text: true,
      createdAt: true,
      sender: { select: { username: true } },
    },
  });
  return messages.map((m) => ({
    id: m.id,
    sender: m.sender?.username || 'Unknown',
    text: m.text,
    ts: m.createdAt.getTime(),
  }));
}

async function getRoomInfo(roomId) {
  const room = await prisma.group.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { members: true } },
    },
  });
  return room;
}

module.exports = {
  addClientToRoom,
  removeClientFromRoom,
  broadcastToRoom,
  getRoomMembers,
  saveMessage,
  getRoomMessageHistory,
  getRoomInfo,
};
