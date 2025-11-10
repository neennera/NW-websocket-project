# Backend API Guidelines - WebSocket Chat with Database Persistence

## Overview

This backend provides a **real-time chat system** built with:

- **Node.js + Express.js** for HTTP API
- **Native WebSocket** (`ws` library) on `/ws` path
- **PostgreSQL + Prisma ORM** for persistent message storage and user management
- **Numeric Room IDs** (Group IDs from database)

The system supports:

- ✅ Group chats (multiple users in one room)
- ✅ 1:1 chats (two users in private room)
- ✅ Real-time messaging with broadcast
- ✅ Message persistence to database
- ✅ Member presence tracking
- ✅ Connection lifecycle management

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (Next.js React)                        │
│  - Home page: select room + username                    │
│  - Group chat page                                      │
│  - 1:1 chat page                                        │
│  - useWebSocket hook (connection manager)               │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket
                     │ (upgrade from HTTP)
┌────────────────────▼────────────────────────────────────┐
│      Express + WebSocket Server (:3001)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ HTTP Routes:                                     │   │
│  │  /auth/login, /auth/register                     │   │
│  │  /profile/update                                 │   │
│  │  /groups (list groups)                           │   │
│  │  /tags, /nicknames (features)                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ WebSocket (/ws):                                 │   │
│  │  - join room (numeric roomId)                    │   │
│  │  - send message (persists to DB)                 │   │
│  │  - leave room                                    │   │
│  │  - list (get current members + history)          │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│      Database Layer (Prisma + PostgreSQL)               │
│  - User, Group, GroupMember tables                       │
│  - Message persistence (id, content, userId, groupId)   │
│  - Message history retrieval                            │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files & Components

### 1. **Server Entry Point** (`index.js`)

```javascript
const express = require('express');
const http = require('http');
const { initializeWebSocket } = require('./src/ws/handler');

const PORT = process.env.PORT || 3001;
const app = express();
app.use(express.json());

// Mount HTTP routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/groups', groupRoutes);

// Create HTTP server for WebSocket upgrade
const server = http.createServer(app);

// Initialize WebSocket on /ws path
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API + WS server listening on port ${PORT}`);
});
```

**Responsibilities:**

- Express app setup with middleware
- HTTP server creation (required for WebSocket upgrade)
- WebSocket initialization
- Port binding

---

### 2. **WebSocket Handler** (`src/ws/handler.js`)

**Message Router:** Processes all incoming WebSocket messages

```javascript
async function handleMessage(ws, msg) {
  const { type } = msg;

  if (type === 'join') {
    // Add client to room + fetch DB members + history
    const { roomId, username } = msg;

    // Check if new join vs refresh
    const isNewJoin = !isClientInRoom(roomId, ws.clientId);

    // Add to active connections
    await addClientToRoom(roomId, ws.clientId, username);

    // Fetch from DB
    const members = await getRoomMembers(roomId);
    const history = await getRoomMessageHistory(roomId);

    // Send to client
    ws.send(JSON.stringify({ type: 'joined', roomId, members, history }));

    // Broadcast join only if NEW (not refresh)
    if (isNewJoin) {
      broadcastToRoom(roomId, {
        type: 'member_joined',
        user: username,
        clientId,
      });
    }
  }
  // ... other message types
}
```

**Message Types:**

| Type      | Direction       | Purpose                                |
| --------- | --------------- | -------------------------------------- |
| `join`    | Client → Server | Enter a room (fetch history + members) |
| `leave`   | Client → Server | Exit a room                            |
| `message` | Client → Server | Send text message (saves to DB)        |
| `list`    | Client → Server | Request current members + history      |
| `error`   | Server → Client | Error response                         |

---

### 3. **Room Manager** (`src/ws/lib-rooms.js`)

**Hybrid approach:** In-memory connection tracking + DB for persistence

```javascript
// In-memory connection tracking
const activeConnections = {
  1: Map(clientId -> { username }),
  2: Map(clientId -> { username }),
};

// Functions

async function addClientToRoom(roomId, clientId, username) {
  // Track active connection
  if (!activeConnections[roomId]) {
    activeConnections[roomId] = new Map();
  }
  activeConnections[roomId].set(clientId, { username });
}

async function getRoomMembers(roomId) {
  // Query database: all GroupMembers for this group
  const group = await prisma.group.findUnique({
    where: { id: roomId },
    include: { members: { include: { user: true } } }
  });

  return group.members.map(m => ({
    id: m.user.id.toString(),
    username: m.user.username
  }));
}

async function saveMessage(roomId, sender, text) {
  // Persist message to database
  const message = await prisma.message.create({
    data: {
      content: text,
      groupId: roomId,
      userId: 1, // TODO: Get from auth context
    }
  });

  return {
    id: message.id,
    sender,
    text: message.content,
    ts: message.createdAt.getTime()
  };
}

function broadcastToRoom(roomId, payload, wsConnections) {
  // Send to all connected clients in room
  const data = JSON.stringify(payload);
  for (const [clientId, _] of activeConnections[roomId]) {
    const ws = wsConnections.get(clientId);
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(data);
    }
  }
}
```

**Key Patterns:**

- **Numeric roomId** = database Group ID
- **activeConnections** = who's currently connected (in-memory)
- **Prisma queries** = all persistent data (members, messages)
- **Broadcast** = sends to all connected clients in a room

---

## WebSocket Protocol Specification

### Message Format

```json
{
  "type": "join|leave|message|list|error",
  "roomId": 1,
  "username": "alice",
  "text": "message content",
  "sender": "alice",
  "members": [
    { "id": "1", "username": "alice" },
    { "id": "2", "username": "bob" }
  ],
  "history": [{ "id": 1, "sender": "alice", "text": "Hi", "ts": 1698000000 }]
}
```

### Message Types & Examples

#### 1️⃣ **JOIN** - Client enters room

**Client sends:**

```json
{
  "type": "join",
  "roomId": 1,
  "username": "alice"
}
```

**Server responds (to client):**

```json
{
  "type": "joined",
  "roomId": 1,
  "members": [
    { "id": "1", "username": "alice" },
    { "id": "2", "username": "bob" }
  ],
  "history": [
    { "id": 1, "sender": "bob", "text": "Hello alice", "ts": 1698000000 },
    { "id": 2, "sender": "alice", "text": "Hi bob", "ts": 1698000010 }
  ]
}
```

**Server broadcasts (to other clients in room):**

```json
{
  "type": "member_joined",
  "user": "alice",
  "clientId": "uuid-123"
}
```

**Note:** Broadcast only if `isNewJoin` is true (not on page refresh)

---

#### 2️⃣ **MESSAGE** - Client sends message

**Client sends:**

```json
{
  "type": "message",
  "roomId": 1,
  "text": "How are you?",
  "sender": "alice"
}
```

**Backend:**

1. Save to database: `INSERT INTO Message(...)`
2. Broadcast to room

**Server broadcasts (to all in room):**

```json
{
  "type": "message",
  "message": {
    "id": 3,
    "sender": "alice",
    "text": "How are you?",
    "ts": 1698000020
  }
}
```

---

#### 3️⃣ **LEAVE** - Client leaves room

**Client sends:**

```json
{
  "type": "leave",
  "roomId": 1
}
```

**Backend:**

1. Remove from `activeConnections[1]`
2. Broadcast to others

**Server broadcasts (to remaining clients):**

```json
{
  "type": "member_left",
  "user": "alice",
  "clientId": "uuid-123"
}
```

---

#### 4️⃣ **LIST** - Client requests current state

**Client sends:**

```json
{
  "type": "list",
  "roomId": 1
}
```

**Server responds:**

```json
{
  "type": "list",
  "members": [...],
  "history": [...]
}
```

**Use case:** After member_joined/member_left broadcast, client requests full list to ensure consistency

---

#### 5️⃣ **ERROR** - Server error

**Server sends (on any error):**

```json
{
  "type": "error",
  "message": "invalid_message|unknown_type|Failed to save message"
}
```

---

## Connection Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. Client connects (HTTP upgrade to WebSocket)          │
│    - Generate unique clientId (UUID)                    │
│    - Set ws.clientId = clientId                         │
│    - Set ws.isAlive = true                              │
│    - Add to wsConnections Map                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Client sends 'join' message                          │
│    - Handler calls addClientToRoom()                    │
│    - Query database for members + history              │
│    - Send back to client                               │
│    - Broadcast member_joined (if isNewJoin)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Client sends messages                               │
│    - Save to database via Prisma                       │
│    - Broadcast to all connected in room                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Keep-alive ping/pong (every 30s)                    │
│    - Server sends ping                                 │
│    - Client auto-responds with pong                    │
│    - Server receives pong → ws.isAlive = true          │
│    - If no pong: terminate connection                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Client leaves (send 'leave' or close connection)    │
│    - Remove from activeConnections                     │
│    - Broadcast member_left                            │
│    - Close WebSocket                                   │
│    - Remove from wsConnections Map                     │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### Room (Numeric ID)

```typescript
{
  roomId: number; // Database Group.id
  name: string; // Group.name
  isPrivateChat: boolean; // Group.isPrivateChat
}
```

**Examples:**

- `roomId: 1` → Group "ABgroup" (public group)
- `roomId: 2` → Group "dm-room" (private 1:1)

### Member

```typescript
{
  id: string; // User.id (converted to string)
  username: string; // User.username
}
```

### Message

```typescript
{
  id: number; // Message.id from DB
  sender: string; // User.username (not userId)
  text: string; // Message.content
  ts: number; // Message.createdAt (milliseconds)
}
```

### Connection

```typescript
{
  clientId: string; // UUID (generated per connection)
  username: string; // User's display name
  ws: WebSocket; // WebSocket object (in-memory only)
}
```

---

## Complete Message Flow Example

### Scenario: Two users in a group chat

**Step 1: Alice joins room 1**

```
Alice (Browser 1)                Server                 Bob (Browser 2)

  send('join', room=1, 'alice')
                              ──→ addClientToRoom(1, alice)
                                  query DB members → [bob]
                                  query DB history → [prev messages]
                              ←── send 'joined'
                                  with members + history

                              ├─→ broadcast 'member_joined'
                                  to: Bob
                                  ←── Bob receives member_joined
```

**Step 2: Alice sends message**

```
Alice                         Server                 Bob

  send('message', 'Hello!')
                              ──→ saveMessage(1, 'alice', 'Hello!')
                                  INSERT INTO Message
                                  ←── message created: id=5

                              ├─→ broadcast 'message'
                                  to: Alice, Bob

  ←── receive 'message'           ←── receive 'message'
      (own message)                   (from alice)
```

**Step 3: Bob requests list (after join)**

```
Bob                           Server                 Alice

  send('list', room=1)
                              ──→ getRoomMembers(1) → [alice, bob]
                                  getRoomMessageHistory(1) → [all msgs]
                              ←── send 'list'
                                  with updated members
```

**Step 4: Alice leaves**

```
Alice                         Server                 Bob

  send('leave', room=1)
                              ──→ removeClientFromRoom(1, alice)

                              ├─→ broadcast 'member_left'
                                  to: Bob
                                  ←── Bob updates UI
```

---

## Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/chat_db"

# Frontend (used by React)
NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"  # Dev
NEXT_PUBLIC_WS_URL="wss://api.example.com/ws" # Prod
```

---

## Running the Server

### Development

```bash
cd apps/api
npm install
npm run dev
# Listens on ws://localhost:3001/ws
```

### Production

```bash
npm run start
# Make sure PORT and DATABASE_URL are set
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed test data
npm run seed
# Creates users A, B
# Creates group 1 (ABgroup) and group 2 (dm-room)
```

---

## Testing WebSocket Manually

### Using Browser Console

````javascript
// Connect
const ws = new WebSocket('ws://localhost:3001/ws');

// Listen to messages
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log('Received:', data);
};

// Join room 1 as alice
ws.send(
  JSON.stringify({
    type: 'join',
    roomId: 1,
    username: 'alice',
  })
);

// Send a message
ws.send(
  JSON.stringify({
    type: 'message',
    roomId: 1,
    text: 'Hello everyone!',
    sender: 'alice',
  })
);

// Request list
ws.send(
  JSON.stringify({
    type: 'list',
    roomId: 1,
  })
);

// Leave room
ws.send(
  JSON.stringify({
    type: 'leave',
    roomId: 1,
  })
);


---

## Error Handling

### Common Error Messages

| Error                    | Cause                | Solution            |
| ------------------------ | -------------------- | ------------------- |
| `invalid_message`        | JSON parse failed    | Ensure valid JSON   |
| `unknown_type`           | Unknown message type | Check protocol spec |
| `Failed to save message` | Database error       | Check DB connection |

### Server-Side Logging

```javascript
// All connection events logged
console.log(`Client ${clientId} connected`);
console.log(`Client ${clientId} disconnected`);
console.error('Invalid message', err);
console.error('Failed to save message:', err);
````
