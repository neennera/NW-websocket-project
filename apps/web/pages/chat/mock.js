import { useRouter } from 'next/router';
import React from 'react';
import { useWebSocket } from '../../lib/useWebSocket';

export default function ChatMock() {
  const router = useRouter();
  const { roomId, username } = router.query;

  const { connected, messages, members, error, sendMessage, disconnect } =
    useWebSocket({
      roomId: roomId ? parseInt(roomId, 10) : null,
      username,
    });

  const handleSendMessage = (text) => {
    sendMessage(text);
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

import React from 'react';
