# WebSocket Chat Usage Guide - Frontend Integration

## Quick Start (5 minutes)

### Prerequisites

```bash
Node.js 16+
npm or pnpm
Backend running on ws://localhost:3001/ws
```

### Frontend Setup

```bash
cd apps/web
npm install
npm run dev
# Open http://localhost:3000
```

### First Test

1. Open `http://localhost:3000`
2. Enter username: `A`
3. Click "Join (Group)" on ABgroup
4. Open another browser tab
5. Enter username: `B`
6. Click "Join (Group)" on ABgroup
7. Send messages - they appear in real-time! ✅

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│       React Component                │
│  (pages/chat/mock.js or              │
│   pages/groupchat/mock.js)           │
└──────────────┬───────────────────────┘
               │
               │ Import hook
               │
┌──────────────▼───────────────────────┐
│     useWebSocket Hook                │
│  (lib/useWebSocket.js)               │
│                                      │
│  ✓ Manages connection lifecycle      │
│  ✓ Sends/receives messages          │
│  ✓ State management                 │
│  ✓ Error handling                   │
└──────────────┬───────────────────────┘
               │
               │ WebSocket
               │
       ws://localhost:3001/ws
```

---

## The useWebSocket Hook

### Location

`apps/web/lib/useWebSocket.js`

### Import & Usage

```javascript
import { useWebSocket } from '../lib/useWebSocket';

export default function ChatPage() {
  const { connected, messages, members, error, sendMessage } = useWebSocket({
    roomId: 1, // Numeric room ID
    username: 'alice', // Display name
    onMessage: (data) => console.log('Got:', data), // Optional
    onError: (err) => console.log('Error:', err), // Optional
  });

  // Now use: connected, messages, members, error, sendMessage
}
```

### Return Values

```typescript
{
  connected: boolean;           // true = connected to WS
  messages: Message[];          // All messages in room
  members: Member[];            // All members in room
  error: string | null;         // Last error (if any)
  sendMessage: (text: string) => boolean;   // Send message, returns success
  requestRoomList: () => void;  // Manually refresh state
  disconnect: () => void;       // Leave room & close connection
}
```

### Message Object

```typescript
{
  id: number; // Message.id from database
  sender: string; // User.username
  text: string; // Message.content
  ts: number; // Timestamp in milliseconds
}
```

### Member Object

```typescript
{
  id: string; // User.id
  username: string; // User.username
}
```

---

## Complete Example: Group Chat Page

File: `apps/web/pages/groupchat/mock.js`

```javascript
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useWebSocket } from '../../lib/useWebSocket';

export default function GroupChatPage() {
  const router = useRouter();
  const { roomId, username } = router.query; // From URL: ?roomId=1&username=alice

  // Initialize WebSocket hook
  const { connected, messages, members, error, sendMessage, disconnect } =
    useWebSocket({
      roomId: roomId ? parseInt(roomId, 10) : null, // Convert to number
      username,
    });

  const [input, setInput] = useState('');

  // Handler: send message on button click
  const handleSendMessage = (text) => {
    const success = sendMessage(text);
    if (success) {
      setInput(''); // Clear input on success
    }
  };

  // Handler: leave room and go back to home
  const handleLeaveRoom = () => {
    disconnect();
    router.push('/');
  };

  if (!roomId || !username) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-4 rounded shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Group Chat</h1>
            <div className="text-sm text-gray-600">
              Room ID: {roomId} — User: {username}
            </div>
            <div
              className={`text-xs mt-2 font-semibold ${
                connected ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Leave Room
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Members List */}
        <div className="mb-4">
          <div className="mb-2 font-semibold text-gray-700">
            Members ({members.length})
          </div>
          <ul className="bg-blue-50 p-3 rounded space-y-1">
            {members.length === 0 ? (
              <li className="text-gray-400 text-sm">No members</li>
            ) : (
              members.map((m) => (
                <li key={m.id} className="text-sm text-gray-800">
                  👤 {m.username}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Messages Display */}
        <div className="mb-4">
          <div className="mb-2 font-semibold text-gray-700">Messages</div>
          <div className="h-64 overflow-auto border rounded p-3 bg-gray-50 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-white p-2 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{msg.sender}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-800">{msg.text}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && input.trim()) {
                handleSendMessage(input);
              }
            }}
            placeholder="Type a message..."
            disabled={!connected}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!connected || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Complete Example: 1:1 Chat Page

File: `apps/web/pages/chat/mock.js`

```javascript
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useWebSocket } from '../../lib/useWebSocket';

export default function ChatMock() {
  const router = useRouter();
  const { roomId, username } = router.query; // ?roomId=2&username=alice

  const { connected, messages, members, error, sendMessage, disconnect } =
    useWebSocket({
      roomId: roomId ? parseInt(roomId, 10) : null,
      username,
    });

  const [input, setInput] = useState('');

  const handleSendMessage = (text) => {
    sendMessage(text);
    setInput('');
  };

  const handleLeaveRoom = () => {
    disconnect();
    router.push('/');
  };

  if (!roomId || !username) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">1:1 Chat</h1>
            <div className="text-sm text-gray-600">
              Room ID: {roomId} — User: {username}
            </div>
            <div
              className={`text-xs mt-2 ${
                connected ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Leave Room
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 mt-2">Error: {error}</div>
        )}

        <div className="mt-4">
          <div className="mb-2 font-medium">Members ({members.length})</div>
          <ul className="mb-4">
            {members.map((m) => (
              <li key={m.id} className="text-sm">
                {m.username}
              </li>
            ))}
          </ul>

          <div className="h-64 overflow-auto border rounded p-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <div className="text-xs text-gray-500">
                    {msg.sender} • {new Date(msg.ts).toLocaleTimeString()}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
          </div>

          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

function MessageInput({ onSendMessage }) {
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="mt-3 flex gap-2">
      <input
        className="flex-1 p-2 border rounded"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message"
      />
      <button
        onClick={handleSend}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
}
```

---

## Home/Lobby Page

File: `apps/web/pages/index.js`

```javascript
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('A');

  // Rooms from database (from seed)
  const groups = [
    { id: 1, name: 'ABgroup' },
    // Add more groups by querying /groups API endpoint
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">WebSocket Chat POC</h1>

        {/* Username Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            placeholder="Enter username"
          />
        </div>

        {/* Group Chats */}
        <section className="mb-6">
          <h2 className="text-lg font-medium">Groups</h2>
          <ul className="mt-2">
            {groups.map((g) => (
              <li key={g.id} className="py-2 flex items-center justify-between">
                <div>{g.name}</div>
                <Link
                  href={{
                    pathname: '/groupchat/mock',
                    query: { roomId: g.id, username },
                  }}
                >
                  <button className="px-3 py-1 bg-blue-600 text-white rounded">
                    Join (Group)
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 1:1 Chat */}
        <section>
          <h2 className="text-lg font-medium">Quick 1:1 Chats</h2>
          <div className="mt-2">
            <Link
              href={{
                pathname: '/chat/mock',
                query: { roomId: 2, username },
              }}
            >
              <button className="px-3 py-2 bg-green-600 text-white rounded">
                Open 2-user mock chat (Room 2)
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
```

---

## How It Works: Message Flow

### User Joins Room

```javascript
// 1. Component mounts with roomId + username
useEffect(() => {
  // 2. Hook initializes WebSocket connection
  const socket = new WebSocket('ws://localhost:3001/ws');

  // 3. On connection open, send join message
  socket.addEventListener('open', () => {
    socket.send(
      JSON.stringify({
        type: 'join',
        roomId: 1,
        username: 'alice',
      })
    );
  });

  // 4. Receive 'joined' response with members + history
  socket.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);

    if (data.type === 'joined') {
      // 5. Update component state with members and messages
      setMembers(data.members); // [{ id, username }, ...]
      setMessages(data.history); // [{ id, sender, text, ts }, ...]
    }
  });
}, [roomId, username]);
```

### Send Message

```javascript
const sendMessage = (text) => {
  // 1. Validate connection
  if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
    return false;
  }

  // 2. Send to server
  wsRef.current.send(
    JSON.stringify({
      type: 'message',
      roomId: 1,
      text: text,
      sender: 'alice',
    })
  );

  // 3. Server saves to DB and broadcasts
  // 4. All clients (including you) receive 'message' event
  // 5. Component updates state: setMessages([...m, newMessage])

  return true;
};
```

### Receive Message Broadcast

```javascript
socket.addEventListener('message', (ev) => {
  const data = JSON.parse(ev.data);

  if (data.type === 'message') {
    // 1. Server broadcast new message
    const { message } = data; // { id, sender, text, ts }

    // 2. Append to messages array
    setMessages((m) => [...m, message]);

    // 3. Component re-renders with new message
  }
});
```

### Member Join/Leave Handling

```javascript
socket.addEventListener('message', (ev) => {
  const data = JSON.parse(ev.data);

  if (data.type === 'member_joined') {
    // 1. Server notifies other clients that someone joined
    console.log(`${data.user} joined the room`);

    // 2. Request updated member list to stay in sync
    socket.send(
      JSON.stringify({
        type: 'list',
        roomId: 1,
      })
    );
  }

  if (data.type === 'list') {
    // 3. Receive updated members + messages
    setMembers(data.members);
    if (data.history) {
      setMessages(data.history);
    }
  }

  if (data.type === 'member_left') {
    // Similar: request list to get updated members
    console.log(`${data.user} left the room`);
    socket.send(JSON.stringify({ type: 'list', roomId: 1 }));
  }
});
```

### Leave Room

```javascript
const disconnect = () => {
  if (wsRef.current) {
    try {
      // 1. Send leave message
      wsRef.current.send(
        JSON.stringify({
          type: 'leave',
          roomId: 1,
        })
      );
      // 2. Server removes from activeConnections
      // 3. Server broadcasts member_left to others

      // 4. Close connection
      wsRef.current.close();
    } catch (e) {
      console.error('Error disconnecting:', e);
    }
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    disconnect();
  };
}, []);
```

---

## Handling Connection States

### Display Online/Offline Status

```javascript
const { connected } = useWebSocket({ roomId, username });

return (
  <div className={connected ? 'text-green-600' : 'text-red-600'}>
    {connected ? '🟢 Online' : '🔴 Offline'}
  </div>
);
```

### Disable Input When Offline

```javascript
const { connected, sendMessage } = useWebSocket({ roomId, username });

const handleSend = () => {
  if (!connected) {
    alert('Not connected to server');
    return;
  }
  sendMessage(input);
};

return <input disabled={!connected} placeholder="Type message..." />;
```

### Display Errors

```javascript
const { error } = useWebSocket({ roomId, username });

return (
  <>
    {error && <div className="text-red-600 p-2 bg-red-50 rounded">{error}</div>}
  </>
);
```

---

## Advanced Patterns

### Custom Message Handler

```javascript
const { connected, messages } = useWebSocket({
  roomId: 1,
  username: 'alice',
  onMessage: (data) => {
    // Called for EVERY message type
    console.log('Raw message:', data);

    // Could send to analytics, logging, etc
    if (data.type === 'message') {
      // Track message metrics
    }
  },
});
```

### Custom Error Handler

```javascript
const { error } = useWebSocket({
  roomId: 1,
  username: 'alice',
  onError: (err) => {
    // Called when error occurs
    console.error('Connection error:', err);

    // Could show toast notification
    showNotification('Chat connection failed', 'error');
  },
});
```

### Manual Refresh

```javascript
const { requestRoomList } = useWebSocket({ roomId, username });

// Button: Manually refresh members + messages
const handleRefresh = () => {
  requestRoomList();
};

return <button onClick={handleRefresh}>Refresh</button>;
```

---

## Environment Variables (Frontend)

File: `apps/web/.env.local`

```bash
# Development
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Production
NEXT_PUBLIC_WS_URL=wss://api.example.com/ws
```

---

## Testing Locally

### Test Scenario 1: Two Users Messaging

1. Terminal 1: Start backend

   ```bash
   cd apps/api
   npm run dev
   ```

2. Terminal 2: Start frontend

   ```bash
   cd apps/web
   npm run dev
   ```

3. Browser 1: Open `http://localhost:3000`

   - Enter username: `alice`
   - Click "Join (Group)" on ABgroup
   - See: connected ✅, members: [alice, bob], messages: [history]

4. Browser 2: Open `http://localhost:3000` (incognito/new tab)

   - Enter username: `bob`
   - Click "Join (Group)" on ABgroup
   - Browser 1 updates: members now shows bob joined ✅

5. Browser 1: Type "Hello bob!" and send

   - Message appears in Browser 1 ✅
   - Message appears in Browser 2 ✅
   - Message saved to database ✅

6. Browser 1: Click "Leave Room"
   - Browser 2 updates: members no longer shows alice ✅

### Test Scenario 2: Message History

1. Open room with username `alice`
2. Send 5 messages
3. Close tab
4. Open new tab (different browser session)
5. Same room, username `bob`
6. See: All 5 messages from alice in history ✅ (persisted to DB)

---

## Performance Tips

### For Production

- **Enable compression**: Gzip messages in production
- **Lazy load messages**: Load older messages on demand (pagination)
- **Debounce input**: Avoid too many state updates
- **Memoize components**: Use `React.memo()` for chat items

### Example: Lazy Load Messages

```javascript
const [messages, setMessages] = useState([]);
const [hasMore, setHasMore] = useState(true);

const loadOlderMessages = () => {
  // Request messages before oldest timestamp
  requestRoomList(); // Could add offset parameter
  // Load 20 older messages
};

return (
  <div>
    {hasMore && <button onClick={loadOlderMessages}>Load More</button>}
    {messages.map((msg) => (
      <MessageItem key={msg.id} msg={msg} />
    ))}
  </div>
);
```

---

## Troubleshooting

### Issue: "Not connected to WebSocket"

**Causes:**

- Backend not running
- Wrong WebSocket URL
- Firewall blocking WebSocket

**Solution:**

```bash
# Check backend is running
lsof -i :3001

# Check frontend env var
echo $NEXT_PUBLIC_WS_URL

# Check browser console
console.log(process.env.NEXT_PUBLIC_WS_URL)
```

### Issue: Messages not appearing in other browser

**Causes:**

- Browser refreshed (new connection)
- WebSocket disconnected
- Message failed to save to DB

**Solution:**

- Check backend logs for errors
- Verify both browsers in same room (roomId)
- Check browser console for errors

### Issue: Duplicate members in list

**Causes:**

- Page refreshed, creates new connection
- Browser tab not updated when other joined

**Solution:**

- Hook requests full `list` on member_joined/member_left
- Frontend deduplicates before rendering

---

## Summary

✅ **Real-time messaging** - WebSocket broadcasts instantly  
✅ **Database persistence** - Messages survive server restart  
✅ **Member presence** - See who's in room  
✅ **Message history** - New members see old messages  
✅ **Error handling** - Graceful error display  
✅ **Connection management** - Auto-cleanup on unmount  
✅ **Easy integration** - Just import hook, pass roomId + username

The `useWebSocket` hook handles all WebSocket complexity - just use it like any other React hook!
