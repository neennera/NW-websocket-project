import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function GroupChatMock() {
  const router = useRouter();
  const { room, username } = router.query;
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [members, setMembers] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!room || !username) return;
    const socket = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = socket;

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'join', room, username }));
    });

    socket.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'joined') {
        setMembers(data.members || []);
        setMessages(data.history || []);
      } else if (data.type === 'member_joined') {
        setMembers((m) => [...m, { id: data.clientId, username: data.user }]);
      } else if (data.type === 'member_left') {
        setMembers((m) => m.filter((x) => x.id !== data.clientId));
      } else if (data.type === 'message') {
        setMessages((m) => [...m, data.message]);
      }
    });

    return () => {
      try {
        socket.send(JSON.stringify({ type: 'leave', room }));
        socket.close();
      } catch (e) {}
    };
  }, [room, username]);

  function sendMessage() {
    if (!wsRef.current || input.trim() === '') return;
    wsRef.current.send(
      JSON.stringify({ type: 'message', room, text: input, sender: username })
    );
    setInput('');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-4 rounded shadow">
        <h1 className="text-xl font-semibold">Group Chat Mock</h1>
        <div className="text-sm text-gray-600">
          Room: {room} — User: {username}
        </div>

        <div className="mt-4">
          <div className="mb-2 font-medium">Members</div>
          <ul className="mb-4">
            {members.map((m) => (
              <li key={m.id} className="text-sm">
                {m.username}
              </li>
            ))}
          </ul>

          <div className="h-64 overflow-auto border rounded p-2 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <div className="text-xs text-gray-500">
                  {msg.sender} • {new Date(msg.ts).toLocaleTimeString()}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex">
            <input
              className="flex-1 p-2 border rounded"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
            />
            <button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
