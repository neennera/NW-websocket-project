# System Architecture Diagrams & Examples

## 1. Complete System Architecture

```
╔════════════════════════════════════════════════════════════════════╗
║                        WEBSOCKET CHAT SYSTEM                       ║
╚════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                      │
│                                                                     │
│  Home Page              Group Chat              1:1 Chat           │
│  ┌────────────────┐    ┌──────────────────┐  ┌──────────────────┐ │
│  │ Username input │    │ Messages Display │  │ Messages Display │ │
│  │ Select Group   │    │ Members List     │  │ Members List     │ │
│  │ Select 1:1     │    │ Message Input    │  │ Message Input    │ │
│  └────────┬───────┘    └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                    ▼            ▼            ▼                     │
│              ┌────────────────────────────────────┐                │
│              │  React Component (Pages)          │                │
│              │  ├─ router.query (roomId, user)   │                │
│              │  └─ state: [input, messages, ...]  │                │
│              └────────────┬───────────────────────┘                │
│                           │                                        │
│              ┌────────────▼───────────────────────┐                │
│              │  useWebSocket Hook (Custom)       │                │
│              │  ├─ connected status              │                │
│              │  ├─ messages state                │                │
│              │  ├─ members state                 │                │
│              │  ├─ sendMessage()                 │                │
│              │  ├─ requestRoomList()             │                │
│              │  └─ disconnect()                  │                │
│              └────────────┬───────────────────────┘                │
└───────────────────────────┼────────────────────────────────────────┘
                            │ WebSocket Connection
                            │ JSON Messages
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SERVER LAYER (Node.js + Express + ws)                  │
│                                                                     │
│  HTTP Server (Express)         WebSocket Server                    │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Routes:                  │  │ Path: /ws                      │ │
│  │ ├─ POST /auth/login      │  │ Handler: initializeWebSocket() │ │
│  │ ├─ POST /auth/register   │  │                                │ │
│  │ ├─ GET /profile          │  │ On connection:                 │ │
│  │ ├─ GET /groups           │  │ ├─ Generate clientId (UUID)    │ │
│  │ ├─ POST /groups          │  │ ├─ Create ws object            │ │
│  │ ├─ GET /tags             │  │ └─ Setup message handlers      │ │
│  │ └─ GET /nicknames        │  │                                │ │
│  └──────────────────────────┘  │ On message (async):            │ │
│                                │ ├─ Parse JSON                  │ │
│                                │ ├─ Call handleMessage(type)    │ │
│                                │ │  ├─ join  → query DB         │ │
│                                │ │  ├─ message → save + broadcast│
│                                │ │  ├─ leave → remove + broadcast│
│                                │ │  └─ list → query DB          │ │
│                                │ └─ Send response or broadcast  │ │
│                                │                                │ │
│                                │ Keep-alive (every 30s):        │ │
│                                │ ├─ Send ping                   │ │
│                                │ ├─ Wait for pong               │ │
│                                │ └─ Terminate if no pong        │ │
│                                └────────────────────────────────┘ │
│                                                                     │
│              ┌──────────────────────────────────┐                 │
│              │  Room Manager (lib-rooms.js)    │                 │
│              │                                  │                 │
│              │  In-Memory:                      │                 │
│              │  ├─ activeConnections Map        │                 │
│              │  │  {roomId: {clientId: ws}}     │                 │
│              │  └─ broadcastToRoom()            │                 │
│              │                                  │                 │
│              │  Database Queries:               │                 │
│              │  ├─ getRoomMembers()             │                 │
│              │  ├─ getRoomMessageHistory()      │                 │
│              │  ├─ saveMessage()                │                 │
│              │  └─ getRoomInfo()                │                 │
│              └────────────────┬─────────────────┘                 │
│                               │                                    │
└───────────────────────────────┼────────────────────────────────────┘
                                │ SQL Queries
                                │ (Prisma ORM)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│            DATABASE LAYER (PostgreSQL + Prisma)                     │
│                                                                     │
│  Tables:                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ User         │  │ Group        │  │ GroupMember              │ │
│  │ ├─ id (PK)   │  │ ├─ id (PK)   │  │ ├─ userId (FK)           │ │
│  │ ├─ username  │  │ ├─ name      │  │ ├─ groupId (FK)          │ │
│  │ ├─ email     │  │ ├─ private   │  │ └─ composite PK (user+g) │ │
│  │ └─ avatar    │  │ └─ createdAt │  └──────────────────────────┘ │
│  └──────────────┘  └──────────────┘                                │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ Message                  │  │ UserTag (optional)       │        │
│  │ ├─ id (PK)               │  │ ├─ id                    │        │
│  │ ├─ content               │  │ ├─ userId (FK)           │        │
│  │ ├─ userId (FK)           │  │ ├─ tagName               │        │
│  │ ├─ groupId (FK)          │  │ └─ createdAt             │        │
│  │ └─ createdAt             │  └──────────────────────────┘        │
│  └──────────────────────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Join Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER JOINS ROOM FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

Browser                          Server                    Database
  │                               │                            │
  ├─ User clicks "Join"           │                            │
  │                               │                            │
  ├─ React renders chat page      │                            │
  │  with roomId=1, username=alice│                            │
  │                               │                            │
  ├─ useWebSocket hook runs       │                            │
  │  useEffect                    │                            │
  │                               │                            │
  ├─ WebSocket opens              │                            │
  ├─ HTTP upgrade to /ws ────────→ Server accepts connection   │
  │                               │ - Generate UUID clientId   │
  │                               │ - Create ws object         │
  │                               │ - Set ws.isAlive = true    │
  │                               │ - Add to wsConnections Map │
  │                               │                            │
  ├─ socket.on('open') fires      │                            │
  │  Send 'join' message          │                            │
  │ ─────────────────────────────→ handleMessage('join')       │
  │  {                             │ ├─ isNewJoin check        │
  │   type: 'join',               │ ├─ addClientToRoom(1, alice)
  │   roomId: 1,                  │ │                          │
  │   username: 'alice'           │ ├─ Query DB: Get group 1   │
  │  }                            │ └─ Select * from Group     │
  │                               │    where id=1              │
  │                               │    include members ───────→ SELECT * FROM GroupMember
  │                               │                            │ WHERE groupId=1
  │                               │                            │
  │                               │ ├─ getRoomMembers(1)       │
  │                               │ │  [{id:1, user:A},         │
  │                               │ │   {id:2, user:B}]         │
  │                               │ │                          │
  │                               │ ├─ getRoomMessageHistory(1)│
  │                               │ └─ SELECT * from Message   │
  │                               │    WHERE groupId=1 ───────→ SELECT * FROM Message
  │                               │    [{id:1, sender:A,       │ WHERE groupId=1
  │                               │      text:'prev msg'}]     │
  │                               │                            │
  │  Receive 'joined' event ←─────┤ Send back 'joined'        │
  │  {                             │ {                          │
  │   type: 'joined',             │  type: 'joined',           │
  │   roomId: 1,                  │  roomId: 1,                │
  │   members: [{id:1, user:A},   │  members: [...],           │
  │             {id:2, user:B}],  │  history: [...]            │
  │   history: [{sender:A,        │ }                          │
  │             text:'prev msg'}] │                            │
  │  }                            │                            │
  │                               ├─ Broadcast to others:     │
  │                               │  (send to all in room)     │
  │  (Other clients receive)      │ {                          │
  │  {type: 'member_joined',      │  type: 'member_joined',    │
  │   user: 'alice',              │  user: 'alice',            │
  │   clientId: 'uuid-123'}       │  clientId: 'uuid-123'      │
  │                               │ }                          │
  ├─ setMembers(data.members)     │                            │
  ├─ setMessages(data.history)    │                            │
  └─ Re-render chat UI ✅          │                            │

Alice's Browser Update:
  Display:
  ├─ 🟢 Connected
  ├─ Members: A, B
  ├─ Previous messages from DB
  └─ Ready to send messages
```

---

## 3. Message Exchange Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   MESSAGE EXCHANGE FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

Alice's Browser         Server              Bob's Browser       Database
  │                      │                      │                   │
  ├─ User types:         │                      │                   │
  │ "Hello Bob!"         │                      │                   │
  │                      │                      │                   │
  ├─ Clicks Send         │                      │                   │
  │                      │                      │                   │
  ├─ sendMessage() ──────→ handleMessage()      │                   │
  │  {                    │  type === 'message' │                   │
  │   type: 'message',   │  │                  │                   │
  │   roomId: 1,         │  ├─ saveMessage()   │                   │
  │   text: 'Hello Bob!',│  │  (async)         │                   │
  │   sender: 'alice'    │  │  ├─ INSERT INTO  │                   │
  │  }                   │  │  │ Message      │                   │
  │                      │  │  │ (content,    │                   │
  │                      │  │  │  groupId=1,  │                   │
  │                      │  │  │  userId=1) ─────────────────────→ INSERT Message
  │                      │  │  │              │                   │ VALUES (...)
  │                      │  │  └─ Return      │                   │
  │                      │  │     message     │                   │
  │                      │  │     object      │                   │
  │                      │  │                  │                   │
  │                      │  ├─ broadcastToRoom(1, {type:'message',
  │                      │  │                    message: {...}})
  │                      │  │                  │                   │
  │  Send 'message' ←────┤  ├─ Find all       │                   │
  │  {type:'message',    │  │ clients in      │                   │
  │   message: {         │  │ room 1 from     │                   │
  │    id: 123,          │  │ activeConnections
  │    sender: 'alice',  │  │                  │                   │
  │    text: 'Hello Bob!',
  │    ts: 1698000020    │  ├─ Send to Alice   │                   │
  │   }                  │  └─ Send to Bob ──→ Receive 'message'  │
  │  }                   │                     {type:'message', ...}
  │                      │                     │                   │
  ├─ Receive own message │                     ├─ Append to state  │
  │ setMessages([...,    │                     │ setMessages([...])
  │ newMsg])             │                     │                   │
  │                      │                     ├─ Re-render UI ✅ │
  ├─ Re-render UI ✅     │                     │                   │
  └─ Show message       │                     └─ Show message    │

Result:
Alice sees: "Me: Hello Bob!" (in chat history)
Bob sees: "alice: Hello Bob!" (in chat history)
Database: Message saved (persisted forever)
```

---

## 4. Leave Room Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEAVE ROOM FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

Alice's Browser              Server                    Bob's Browser
  │                           │                           │
  ├─ Click "Leave Room"       │                           │
  │                           │                           │
  ├─ disconnect()             │                           │
  │                           │                           │
  ├─ Send leave message ─────→ handleMessage('leave')     │
  │  {                        │  ├─ roomId = 1            │
  │   type: 'leave',          │  ├─ clientId = uuid-alice │
  │   roomId: 1               │  │                        │
  │  }                        │  ├─ removeClientFromRoom  │
  │                           │  │  (1, uuid-alice)       │
  │                           │  │  ├─ Delete from        │
  │                           │  │  │ activeConnections[1]│
  │                           │  │  └─ Return alice obj   │
  │                           │  │                        │
  │                           │  ├─ broadcastToRoom      │
  │                           │  │  (1, {type: 'member_left',
  │                           │  │      user: 'alice'})   │
  │                           │  │                        │
  │                           │  ├─ Send to Bob ────────→ Receive
  │                           │  └─                       {'member_left',
  │                           │                           'alice'}
  │                           │                           │
  ├─ Close WebSocket ─────────→ ws.on('close')           │
  │                           │  └─ cleanup              │
  │  Page redirects to / ✅   │    remove from           │
  │                           │    wsConnections         │
  │                           │                          │
  │                           │                          ├─ Hook catches
  │                           │                          │ 'member_left'
  │                           │                          │
  │                           │                          ├─ Send 'list'
  │                           │                          │ request
  │                           │                          │
  │                           │ ←─ getRoomMembers(1)    │
  │                           │    [{id:2, user:B}]     │
  │                           │                          │
  │                           │ Send 'list' ───────────→ setMembers([B])
  │                           │                          │
  │                           │                          ├─ Re-render UI ✅
  │                           │                          │
  │                           │                          └─ Show: only Bob
  │                           │                              in room now
  │                           │
  Cleanup complete:
  Alice: disconnected from server
  Bob: sees Alice left room
  Server: Alice removed from activeConnections[1]
  Database: No changes (messages preserved)
```

---

## 5. Keep-Alive Ping/Pong (every 30s)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  KEEP-ALIVE PING/PONG                               │
└─────────────────────────────────────────────────────────────────────┘

Time: 0s
  setInterval every 30000ms

Time: 30s
  Server checks all connections:

  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      return ws.terminate();  // Kill dead connections
    }
    ws.isAlive = false;
    ws.ping();                // Send ping
  }

  ├─ Send ping ──────────→ Browser
  │                       ├─ Browser auto-responds with pong
  │                       └─ Send pong back
  │
  ←─ Receive pong ──────┤
  │
  └─ Set ws.isAlive = true ✓ (still alive)

Time: 60s
  Server checks again...
  (repeat cycle)

If no pong received:
  Time: 30s - Send ping
  Time: 60s - Check: isAlive still false
           - Terminate connection
           - Trigger ws.on('close')
           - Clean up from all rooms
           - Other clients see 'member_left'
```

---

## 6. Data Flow: States & Updates

```
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND STATE MANAGEMENT                              │
└─────────────────────────────────────────────────────────────────────┘

useWebSocket Hook:

const [connected, setConnected] = useState(false);
const [messages, setMessages] = useState([]);
const [members, setMembers] = useState([]);
const [error, setError] = useState(null);

State Transitions:

1. Component Mount:
   connected: false
   messages: []
   members: []
   error: null

2. WebSocket opens:
   connected: true
   messages: []
   members: []
   error: null

3. Receive 'joined':
   connected: true
   messages: [from DB history]
   members: [from DB GroupMembers]
   error: null

4. Other user joins (broadcast 'member_joined'):
   connected: true
   messages: [unchanged]
   members: [request fresh list from server]
   error: null

5. User sends message (receives broadcast):
   connected: true
   messages: [append new message]
   members: [unchanged]
   error: null

6. Error occurs:
   connected: true (or false)
   messages: [unchanged]
   members: [unchanged]
   error: "error message"

7. WebSocket closes:
   connected: false
   messages: [preserved]
   members: [preserved]
   error: null
```

---

## 7. Example: Complete Chat Session

```
Time 00:00 - Session starts

Alice opens http://localhost:3000
│ Sees: Home page with username input
│
├─ Enters username: "alice"
├─ Clicks: "Join (Group)" on ABgroup (roomId=1)
│
└─ Navigates to: /groupchat?roomId=1&username=alice

Time 00:01 - Alice joins

Alice's browser:
├─ useWebSocket initializes
├─ WebSocket connects to ws://localhost:3001/ws
├─ Sends: {type:'join', roomId:1, username:'alice'}
│
Server:
├─ Creates connection, clientId=uuid-1
├─ Queries: GROUP 1 members → [A, B]
├─ Queries: GROUP 1 messages → [prev message from B]
├─ Sends back: {type:'joined', members:[A,B], history:[...]}
├─ Broadcasts: {type:'member_joined', user:'alice'}
│
Bob's browser (already connected):
├─ Receives: member_joined
├─ Requests: {type:'list', roomId:1}
└─ Gets: fresh members list

Display:
Alice: 🟢 Connected | Members: A, B | Messages: [1 prev msg] | Input ready
Bob:   🟢 Connected | Members: A, B | Messages: [1 prev msg] | (Alice just joined)

---

Time 00:05 - Alice sends message

Alice types: "Hello Bob!" and clicks Send

Alice's browser:
├─ sendMessage('Hello Bob!')
├─ Sends: {type:'message', roomId:1, text:'Hello Bob!', sender:'alice'}
│
Server:
├─ Receives message
├─ Saves to DB: INSERT Message (content='Hello Bob!', groupId=1, userId=1)
├─ Message ID: 123
├─ Broadcasts: {type:'message', message:{id:123, sender:'alice', text:'Hello Bob!', ts:...}}
│
Both browsers:
├─ Receive message broadcast
├─ Append to messages state
├─ Re-render chat
│
Display:
Alice:
  Previous message from B
  (1 prev msg)
  alice: Hello Bob!

Bob:
  Previous message from B
  (1 prev msg)
  alice: Hello Bob!

Database:
  Message(id=123, content='Hello Bob!', groupId=1, userId=1)

---

Time 00:08 - Bob sends message

Bob types: "Hi Alice!" and clicks Send

Similar flow:
├─ Both see: "bob: Hi Alice!"
└─ DB: New message saved

---

Time 00:15 - Alice refreshes browser

Alice hits F5

Alice's browser:
├─ Old connection closes
├─ New connection opens
├─ useWebSocket runs again (roomId=1, username='alice')
├─ Sends: {type:'join', roomId:1, username:'alice'}
├─ isNewJoin check: true (new clientId)
│
Server:
├─ New clientId=uuid-2 (different from uuid-1)
├─ Queries: GROUP 1 members → [A, B]
├─ Queries: GROUP 1 messages → [prev, alice, bob, ...]
├─ Sends: {type:'joined', members:[A,B], history:[all 3 msgs]}
├─ Broadcasts: {type:'member_joined', user:'alice'} (new join)
│
Bob's browser:
├─ Receives: member_joined
├─ Requests: {type:'list', roomId:1}
└─ Gets: [A, B] (no duplicates)

Alice's display:
├─ Sees all 3 messages again (from DB history)
├─ Members: A, B
└─ Ready to continue

---

Time 00:20 - Alice leaves

Alice clicks: "Leave Room"

Alice's browser:
├─ Sends: {type:'leave', roomId:1}
├─ Closes WebSocket
├─ Redirects to home page
│
Server:
├─ Removes Alice from activeConnections[1]
├─ Broadcasts: {type:'member_left', user:'alice'}
│
Bob's browser:
├─ Receives: member_left
├─ Requests: {type:'list', roomId:1}
├─ Gets: [{id:2, user:B}]
├─ Updates members state
└─ Re-renders

Bob's display:
├─ Members: B (only Bob now)
├─ All messages still visible (DB persists)
└─ Waiting for other members to join

Database:
  Message 1: prev msg (saved in past)
  Message 2: alice - Hello Bob!
  Message 3: bob - Hi Alice!
  (All preserved for next session)

---

Session Complete ✅

Key points:
✓ Alice → Bob message in real-time
✓ Database persistent (survives refresh/disconnect)
✓ Members tracked while connected
✓ No duplicates on refresh
✓ Clean disconnect and state restoration
```

---

## 8. Error Scenarios

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                                  │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: Malformed JSON
  Client sends: "not valid json"
  Server:
    ├─ ws.on('message') → JSON.parse() fails
    ├─ Catch error
    └─ Send: {type:'error', message:'invalid_message'}
  Client:
    ├─ Receive error
    ├─ setError('invalid_message')
    └─ Display: ⚠️ Error: invalid_message

---

Scenario 2: Unknown Message Type
  Client sends: {type:'unknown_command'}
  Server:
    ├─ handleMessage() checks type
    ├─ No matching case
    └─ Send: {type:'error', message:'unknown_type'}
  Client:
    ├─ Receive error
    ├─ setError('unknown_type')
    └─ Display: ⚠️ Error: unknown_type

---

Scenario 3: Database Error (save message fails)
  Client sends: {type:'message', roomId:1, ...}
  Server:
    ├─ saveMessage() calls Prisma
    ├─ DB error (connection lost)
    ├─ catch (err) → return null
    └─ Send: {type:'error', message:'Failed to save message'}
  Client:
    ├─ Receive error
    ├─ setError('Failed to save message')
    └─ Display: ⚠️ Error: Failed to save message
    └─ User can retry

---

Scenario 4: Network Timeout (no server response)
  Client sends message
  No response for 30+ seconds
  Server sends ping
  If no pong:
    ├─ Server terminates connection
    └─ ws.on('close') fires
  Client:
    ├─ Connection closes
    ├─ setConnected(false)
    ├─ setError('WebSocket connection error')
    └─ Display: 🔴 Disconnected
    └─ User can refresh to reconnect

---

Scenario 5: User tries to join non-existent room
  Client sends: {type:'join', roomId:999, username:'alice'}
  Server:
    ├─ getRoomMembers(999) → DB query returns []
    ├─ getRoomMessageHistory(999) → DB query returns []
    ├─ Send: {type:'joined', members:[], history:[]}
    └─ addClientToRoom(999, clientId) anyway
  Client:
    ├─ setMembers([])
    ├─ setMessages([])
    └─ Shows empty chat (room didn't exist, but connection OK)
  Database:
    └─ If user sends message, room 999 must exist first (FK constraint)
    └─ Message save fails → error response

---

Scenario 6: Connection drops during message send
  Client sends: {type:'message', ...}
  Network drops
  Server never receives
  Client timeout
  Browser detects: ws.readyState !== OPEN
  Client:
    ├─ setError('Not connected to WebSocket')
    └─ Display: ⚠️ Error: Not connected to WebSocket
  User clicks Send again:
    └─ If still disconnected, error repeated
  Auto-reconnect (advanced):
    ├─ Detect disconnect
    ├─ Attempt to reconnect
    ├─ If successful: rejoin room + request list
    └─ Catch up on missed messages

```

---

## 9. Performance Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE TIMELINE                               │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Join Group"

T=0ms:   Page navigation starts
T=50ms:  Next.js page loads
T=100ms: React mounts GroupChat component
T=150ms: useWebSocket hook initializes
T=200ms: WebSocket connection starts (HTTP upgrade)
T=250ms: Connection established
         - Server generates clientId (< 1ms)
         - Server receives 'join' message (< 1ms)
T=300ms: Server queries database
         - SELECT FROM Group (index lookup: 1-5ms)
         - SELECT FROM GroupMember + User (join: 5-10ms)
         - SELECT FROM Message (limit 100: 10-20ms)
         Total DB query: 20-35ms
T=335ms: Server sends 'joined' response
T=350ms: Browser receives response (< 1ms network + parsing)
         - React state updates (< 1ms)
         - Component re-renders (< 5ms)
T=360ms: User sees chat UI populated ✅
         Total time: ~360ms from click to ready

---

User types and sends message

T=1000ms: User clicks Send button
T=1001ms: sendMessage('Hello') called
T=1002ms: Message sent via WebSocket (< 1ms transmission)
T=1003ms: Server receives (< 1ms parsing)
T=1004ms: saveMessage() to database (INSERT: 5-10ms)
T=1014ms: Server broadcasts to room
T=1015ms: All clients receive (network: < 5ms)
T=1020ms: React updates messages state
T=1025ms: UI re-renders with new message ✅
          Total latency: ~25ms (user perspective)

---

Multiple clients (10 users in room)

T=1004ms: Server saves message
T=1005ms: Iterates activeConnections[roomId]
          - 10 clients × ~1ms send per client = 10ms
T=1015ms: Last client receives broadcast
          Network varies per client: 2-10ms
          React updates: each client 5-10ms
T=1025ms: All 10 clients show message ✅
          P99 latency: ~25ms
          P99 aggregate: ~35ms

---

Keep-alive ping/pong (every 30s)

T=30000ms: Server sends ping to all clients
T=30001ms: Each client auto-responds with pong (< 1ms)
T=30002ms: Server receives pongs (bulk processing)
T=30005ms: All connections validated ✅
           Total keep-alive time: < 5ms per cycle
           CPU impact: minimal (millisecond task)
```

---

## 10. Message State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MESSAGE STATE MACHINE                              │
└─────────────────────────────────────────────────────────────────────┘

                    User composes message
                           │
                           ▼
                  ┌─────────────────┐
                  │ Message Pending │ (exists only in UI input)
                  └────────┬────────┘
                           │
                  User clicks Send
                           │
                           ▼
                  ┌─────────────────┐
                  │ Message Transit │ (sent to server)
                  │ (in network)    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Message Pending │ (received by server)
                  │ (server)        │ (not yet in DB)
                  └────────┬────────┘
                           │
           Prisma INSERT INTO Message
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
            DB Save ✓         DB Error ✗
                    │             │
                    ▼             ▼
            ┌──────────────┐  ┌──────────────────┐
            │ Persisted    │  │ Error Response   │
            │ in Database  │  │ Sent to Client   │
            └──────┬───────┘  └──────┬───────────┘
                   │                 │
          Broadcast to                │
          all clients                 │
                   │                 │
        ┌──────────┴─────────┐       │
        │                    │       │
        ▼                    ▼       ▼
   ┌────────────┐      ┌────────────┐    ┌──────────────┐
   │ Sender:    │      │ Other      │    │ Sender:      │
   │ Message    │      │ Clients:   │    │ Error shown  │
   │ shows ✓    │      │ Message    │    │ User retries │
   │ in history │      │ received   │    │ or continues │
   └────────────┘      │ + added    │    └──────────────┘
                       │ to UI      │
                       └────────────┘
```
