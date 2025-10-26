import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');

  // Mocked lists
  const servers = [{ id: 's1', name: 'Server 1' }];
  const groups = [
    { id: 'g1', name: 'Group Alpha' },
    { id: 'g2', name: 'Group Beta' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">WebSocket Chat POC</h1>
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

        <section className="mb-6">
          <h2 className="text-lg font-medium">Servers</h2>
          <ul className="mt-2">
            {servers.map((s) => (
              <li key={s.id} className="py-1">
                {s.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-medium">Groups</h2>
          <ul className="mt-2">
            {groups.map((g) => (
              <li key={g.id} className="py-2 flex items-center justify-between">
                <div>{g.name}</div>
                <div className="space-x-2">
                  <Link
                    href={{
                      pathname: '/groupchat/mock',
                      query: { room: g.id, username },
                    }}
                  >
                    <a className="px-3 py-1 bg-blue-600 text-white rounded">
                      Join (Group)
                    </a>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium">Quick 1:1 Chat</h2>
          <div className="mt-2">
            <Link
              href={{
                pathname: '/chat/mock',
                query: { room: 'dm-room', username },
              }}
            >
              <a className="px-3 py-2 bg-green-600 text-white rounded">
                Open 2-user mock chat
              </a>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
