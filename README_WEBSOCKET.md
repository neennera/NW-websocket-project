# WebSocket Chat System Documentation

## Overview

This is a **real-time bidirectional chat system** built with WebSocket technology. It enables multiple users to join chat rooms, exchange messages, and see live member status updates. The architecture uses:

- **Backend**: Node.js + Express + WebSocket (`ws` library)
- **Frontend**: Next.js + React with custom `useWebSocket` hook
- **Storage**: In-memory POC (proof of concept) - suitable for learning

## Architecture

### System Flow

```
[Client Browser]
    ↓ (HTTP Upgrade)
[WebSocket Connection] ↔ [API Server]
    ↓ (Message Events)
[Room Handler] → [Room Manager (lib-rooms.js)]
    ↓
[In-Memory Storage]
    ↓
[Broadcast to all members in room]
```

## Backend Structure

### Files

- **`api/index.js`**: Express server setup with HTTP server for WebSocket upgrade
- **`api/src/ws/handler.js`**: WebSocket connection handler and message router
- **`api/src/ws/lib-rooms.js`**: Room management algorithms and broadcast utilities

### Room Management (`lib-rooms.js`)

The room management module provides clean, reusable functions:

```javascript
// Data structure
const rooms = {
  'roomName': {
    members: Map(clientId → {username, ws}),
    messages: [{id, sender, text, ts}, ...]
  }
}
```

#### Available Functions

| Function                               | Purpose                                            |
| -------------------------------------- | -------------------------------------------------- |
| `ensureRoom(room)`                     | Creates room if doesn't exist; returns room object |
| `broadcastRoom(room, payload)`         | Sends message to all members in a room             |
| `removeMemberFromRoom(room, clientId)` | Removes and returns a member                       |
| `addMessageToRoom(room, message)`      | Adds message to room's message history             |
| `getRoomMembers(room)`                 | Returns array of `{id, username}` objects          |
| `getRoomMessages(room)`                | Returns array of all messages in room              |
| `cleanupEmptyRooms()`                  | Deletes rooms with no members                      |
| `getAllRooms()`                        | Returns entire rooms object (for debugging)        |

### Message Protocol

All WebSocket messages are JSON objects with a `type` field indicating the action.

#### Client → Server Messages

##### Join Room

```json
{
  "type": "join",
  "room": "room-id",
  "username": "John"
}
```

**Response**: `joined` message with members and history

##### Send Message

```json
{
  "type": "message",
  "room": "room-id",
  "text": "Hello everyone!",
  "sender": "John"
}
```

**Broadcast to room**: `message` type event

##### Leave Room

```json
{
  "type": "leave",
  "room": "room-id"
}
```

**Broadcast to room**: `member_left` event

##### List Room Contents

```json
{
  "type": "list",
  "room": "room-id"
}
```

**Response**: `list` message with members and history

#### Server → Client Messages

##### Joined Event (on successful join)

```json
{
  "type": "joined",
  "room": "room-id",
  "members": [
    { "id": "uuid-1", "username": "Alice" },
    { "id": "uuid-2", "username": "Bob" }
  ],
  "history": [
    { "id": "uuid", "sender": "Alice", "text": "Hi!", "ts": 1635789012345 }
  ]
}
```

##### Member Joined Event (broadcast)

```json
{
  "type": "member_joined",
  "user": "Charlie",
  "clientId": "uuid-3"
}
```

##### Member Left Event (broadcast)

```json
{
  "type": "member_left",
  "user": "Bob",
  "clientId": "uuid-2"
}
```

##### Message Event (broadcast)

```json
{
  "type": "message",
  "message": {
    "id": "uuid",
    "sender": "Alice",
    "text": "Hello!",
    "ts": 1635789012345
  }
}
```

##### Error Event

```json
{
  "type": "error",
  "message": "unknown_type|invalid_message"
}
```

## Frontend Integration

### Using the `useWebSocket` Hook

The `useWebSocket` hook (`web/lib/useWebSocket.js`) simplifies WebSocket integration:

```javascript
import { useWebSocket } from '../lib/useWebSocket';

function ChatComponent() {
  const { connected, messages, members, error, sendMessage } = useWebSocket({
    room: 'chat-room-1',
    username: 'Alice',
    wsUrl: 'ws://localhost:3001/ws', // optional, defaults to this
  });

  const handleSend = () => {
    sendMessage('Hello!');
  };

  return (
    <div>
      <div>{connected ? '✓ Connected' : '✗ Disconnected'}</div>
      <div>Members: {members.length}</div>
      <div>Messages: {messages.length}</div>
      {error && <p>Error: {error}</p>}
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Hook API

#### Parameters

```javascript
useWebSocket({
  room: string,           // Required: room identifier
  username: string,       // Required: display name
  wsUrl?: string,         // Optional: WebSocket URL (default: ws://localhost:3001/ws)
  onMessage?: Function,   // Optional: callback for all messages
  onError?: Function,     // Optional: callback for errors
})
```

#### Return Value

```javascript
{
  connected: boolean,           // Connection status
  messages: Array,              // Array of {id, sender, text, ts}
  members: Array,               // Array of {id, username}
  error: string|null,           // Error message if any
  sendMessage: Function,        // (text: string) → boolean
  requestRoomList: Function,    // () → void (refresh state)
  disconnect: Function,         // () → void (manually close)
}
```

### Example: Simple Chat Component

```javascript
import React, { useState } from 'react';
import { useWebSocket } from '../lib/useWebSocket';

export default function SimpleChat() {
  const router = useRouter();
  const { room, username } = router.query;

  const { connected, messages, members, sendMessage } = useWebSocket({
    room,
    username,
  });

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (sendMessage(input)) {
      setInput('');
    }
  };

  return (
    <div>
      <h1>{room}</h1>
      <p>Status: {connected ? '🟢 Online' : '🔴 Offline'}</p>

      <div>
        <h2>Members ({members.length})</h2>
        {members.map((m) => (
          <div key={m.id}>{m.username}</div>
        ))}
      </div>

      <div
        style={{ height: '300px', overflow: 'auto', border: '1px solid #ccc' }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

## Data Flow Diagram

### Joining a Room

```
Client                    Server
  │
  ├─ WS Connect ─────────→ connection event
  │                        ↓
  │                        generateClientId
  │                        setupPing/Pong
  │
  ├─ {type:'join'} ──────→ handleMessage('join')
  │                        ↓
  │                        ensureRoom(room)
  │                        addToMembers
  │                        getRoomMembers()
  │                        getRoomMessages()
  │
  ←─ {type:'joined'} ─────┤
  │   + members + history
  │
  ←─ {type:'member_joined'} ┤ (broadcast to others)
```

### Sending a Message

```
Client                    Server
  │
  ├─ {type:'message'} ──→ handleMessage('message')
  │                       ↓
  │                       create message {id, sender, text, ts}
  │                       addMessageToRoom()
  │
  ←─ {type:'message'} ────┤ (broadcast to all in room)
     + message object
```

### Leaving a Room

```
Client                    Server
  │
  ├─ {type:'leave'} ────→ handleMessage('leave')
  │                       ↓
  │                       removeMemberFromRoom()
  │                       cleanupEmptyRooms()
  │
  ├─ close() ───────────→ 'close' event
  │                       ↓
  │                       cleanup any remaining memberships
  │
  ←─ {type:'member_left'} ┤ (broadcast before cleanup)
```

## Connection Management

### Ping/Pong Heartbeat

The server sends periodic pings (every 30 seconds) to detect disconnected clients:

```javascript
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

Clients automatically respond with pong. If a client doesn't respond, it's terminated.

## Running the System

### Start the API Server

```bash
cd api
npm install
npm start
# Server runs on http://localhost:3001
# WebSocket available at ws://localhost:3001/ws
```

### Start the Frontend

```bash
cd web
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### Access Chat Rooms

Navigate to:

- 1:1 Chat: `http://localhost:3000/chat/mock?room=test&username=Alice`
- Group Chat: `http://localhost:3000/groupchat/mock?room=dev-team&username=Bob`

## Performance Considerations

### Current Limitations

- **In-memory storage**: All data lost on server restart
- **Single server**: No scaling across multiple instances
- **No persistence**: Consider Redis/Database for production
- **No authentication**: Any username is accepted

### Improvements for Production

```javascript
// Future: Add database persistence
async function addMessageToRoom(room, message) {
  const r = ensureRoom(room);
  r.messages.push(message);

  // Persist to database
  await db.messages.create({ room, ...message });
}

// Future: Add Redis for multi-server scalability
const redis = require('redis');
async function broadcastRoom(room, payload) {
  // Publish to Redis channel
  await redis.publish(`room:${room}`, JSON.stringify(payload));
}
```

## Error Handling

### Common Errors

| Error                        | Cause                        | Solution                          |
| ---------------------------- | ---------------------------- | --------------------------------- |
| `invalid_message`            | JSON parse failed            | Ensure message is valid JSON      |
| `unknown_type`               | Unknown message type         | Check protocol documentation      |
| `Not connected to WebSocket` | Server disconnected          | Auto-reconnect or show offline UI |
| `Failed to parse message`    | Invalid response from server | Server should send valid JSON     |

### Client-Side Error Handling

```javascript
const { error, connected } = useWebSocket({
  room,
  username,
  onError: (err) => {
    console.error('WebSocket error:', err);
    // Show toast notification
    // Attempt reconnect
  },
});

if (error) {
  return <div className="alert">{error}</div>;
}
```

## Security Considerations ⚠️

This is a **proof-of-concept implementation**. For production:

1. **Authentication**: Verify user identity before allowing room access
2. **Authorization**: Control which users can join which rooms
3. **Rate Limiting**: Prevent message spam
4. **Input Validation**: Sanitize all user inputs
5. **HTTPS/WSS**: Always use secure connections in production
6. **CORS**: Restrict WebSocket origin

## Testing

### Test Joining Two Users

1. Open `http://localhost:3000/chat/mock?room=test&username=Alice`
2. Open another browser window: `http://localhost:3000/chat/mock?room=test&username=Bob`
3. Send messages - they appear in both windows in real-time
4. Close one window - other window shows "Bob left"

### Test Message History

1. Join room as Alice
2. Send 5 messages
3. Open new window as Bob joining same room
4. Bob sees Alice's 5 messages in history

## File Structure After Changes

```
api/
├── src/ws/
│   ├── handler.js        (✓ Refactored - uses lib-rooms)
│   └── lib-rooms.js      (✓ Enhanced with new functions)
└── index.js

web/
├── lib/
│   └── useWebSocket.js   (✨ New - reusable hook)
└── pages/
    ├── chat/mock.js      (✓ Refactored - uses hook)
    └── groupchat/mock.js (✓ Refactored - uses hook)
```

## Summary

This WebSocket chat system provides:

✅ **Real-time messaging** between multiple users  
✅ **Room-based isolation** of conversations  
✅ **Member presence awareness** (join/leave events)  
✅ **Message history** for late joiners  
✅ **Clean architecture** with separated concerns  
✅ **Reusable frontend hook** for easy integration  
✅ **Production-ready patterns** (with security upgrades needed)

The modular design makes it easy to:

- Add persistence (database)
- Scale to multiple servers (Redis pub/sub)
- Implement authentication
- Add new message types
- Track analytics
