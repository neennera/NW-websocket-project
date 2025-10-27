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

async function getRoomMembers(roomId) {
  try {
    // roomId is now a numeric group ID, query directly
    const group = await prisma.group.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      return [];
    }

    // Return all group members from the database
    return group.members.map((member) => ({
      id: member.user.id.toString(),
      username: member.user.username,
    }));
  } catch (err) {
    console.error('Failed to get room members:', err);
    return [];
  }
}

async function getRoomMessageHistory(roomId) {
  try {
    // roomId is now numeric, use it directly as groupId
    const messages = await prisma.message.findMany({
      where: { groupId: roomId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    });
    return messages.map((m) => ({
      id: m.id,
      sender: m.user?.username || 'Unknown',
      text: m.content,
      ts: m.createdAt.getTime(),
    }));
  } catch (err) {
    console.error('Failed to fetch message history:', err);
    return [];
  }
}

async function getRoomInfo(roomId) {
  try {
    // roomId is now numeric
    const room = await prisma.group.findUnique({
      where: { id: roomId },
      include: {
        _count: { select: { members: true } },
      },
    });
    return room;
  } catch (err) {
    console.error('Failed to fetch room info:', err);
    return null;
  }
}

async function saveMessage(roomId, sender, text) {
  try {
    // roomId is now numeric, use it directly as groupId
    const message = await prisma.message.create({
      data: {
        content: text,
        groupId: roomId,
        userId: 1, // TODO: Get actual userId from auth context
      },
    });
    return {
      id: message.id,
      sender,
      text: message.content,
      ts: message.createdAt.getTime(),
    };
  } catch (err) {
    console.error('Failed to save message:', err);
    return null;
  }
}

function isClientInRoom(roomId, clientId) {
  return activeConnections[roomId] && activeConnections[roomId].has(clientId);
}

module.exports = {
  addClientToRoom,
  removeClientFromRoom,
  broadcastToRoom,
  getRoomMembers,
  saveMessage,
  getRoomMessageHistory,
  getRoomInfo,
  isClientInRoom,
};
