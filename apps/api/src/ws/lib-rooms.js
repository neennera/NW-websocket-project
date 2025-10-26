// In-memory structures for POC

// DEV TODO : change in-memory rooms into a real room from DB
// { roomName: { members: Map(clientId -> { username, ws }), messages: [{ id, sender, text, ts }] } }
const rooms = {};

// DEV TODO : GET /room from room id
function ensureRoom(room) {
  if (!rooms[room]) {
    rooms[room] = { members: new Map(), messages: [] };
  }
  return rooms[room];
}

// Broadcasts a payload to all members in a room
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

// Removes a member from a room, The removed member or null if not found
function removeMemberFromRoom(room, clientId) {
  const r = rooms[room];
  if (!r) return null;
  const member = r.members.get(clientId);
  if (member) {
    r.members.delete(clientId);
  }
  return member || null;
}

// Adds a message to a room's message history
function addMessageToRoom(room, message) {
  const r = ensureRoom(room);
  r.messages.push(message);
  // DEV TODO : add this into DB
}

// Gets all members in a room as an array => Array of {id, username}
function getRoomMembers(room) {
  const r = rooms[room];
  if (!r) return [];
  return Array.from(r.members.entries()).map(([id, m]) => ({
    id,
    username: m.username,
  }));
}

// Gets all messages in a room
function getRoomMessages(room) {
  const r = rooms[room];
  return r ? r.messages : [];
}

// Cleans up empty rooms
function cleanupEmptyRooms() {
  for (const [roomName, room] of Object.entries(rooms)) {
    if (room.members.size === 0) {
      delete rooms[roomName];
    }
  }
}

/**
 * Gets all rooms (for debugging/monitoring)
 * @returns {Object} Rooms object
 */
function getAllRooms() {
  return rooms;
}

module.exports = {
  ensureRoom,
  broadcastRoom,
  removeMemberFromRoom,
  addMessageToRoom,
  getRoomMembers,
  getRoomMessages,
  cleanupEmptyRooms,
  getAllRooms,
};
