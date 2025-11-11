import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../lib/useWebSocket';

const AVATARS = [
  '�', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'
];

export default function GroupChatMock() {
  const router = useRouter();
  const { roomId, username } = router.query;
  const messagesEndRef = useRef(null);
  const hasFetchedData = useRef(false); // ป้องกัน fetch ซ้ำ

  const [user, setUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  
  // Nickname & Tag states
  const [nicknames, setNicknames] = useState({});
  const [tags, setTags] = useState({});
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newNickname, setNewNickname] = useState('');
  const [newTag, setNewTag] = useState('');
  
  // Forbidden words states
  const [forbiddenWords, setForbiddenWords] = useState([]);
  const [showForbiddenModal, setShowForbiddenModal] = useState(false);
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { connected, messages, members, sendMessage, disconnect } =
    useWebSocket({
      roomId: roomId ? parseInt(roomId, 10) : null,
      username,
    });

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      router.push('/register-login/mock');
      return;
    }
    
    setUser(JSON.parse(storedUser));
  }, []);

  // Fetch group info, nicknames, tags, and forbidden words
  useEffect(() => {
    if (!roomId || !user || hasFetchedData.current) return;

    const fetchData = async () => {
      try {
        hasFetchedData.current = true; // ทำครั้งเดียว
        const token = localStorage.getItem('token');
        
        // Fetch group info
        const groupRes = await fetch(`http://localhost:3001/api/groups/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroupInfo(groupData);
        }

        // Fetch nicknames for this group
        const nicknamesRes = await fetch(`http://localhost:3001/api/nicknames?groupId=${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (nicknamesRes.ok) {
          const nicknamesData = await nicknamesRes.json();
          const nicknamesMap = {};
          nicknamesData.forEach(n => {
            nicknamesMap[n.userIdTarget] = n.nickname;
          });
          setNicknames(nicknamesMap);
        }

        // Fetch tags
        const tagsRes = await fetch(`http://localhost:3001/api/tags`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          const tagsMap = {};
          tagsData.forEach(t => {
            if (!tagsMap[t.userIdTarget]) tagsMap[t.userIdTarget] = [];
            tagsMap[t.userIdTarget].push(t.tagName);
          });
          setTags(tagsMap);
        }

        // Fetch forbidden words
        const forbiddenRes = await fetch(`http://localhost:3001/api/groups/${roomId}/forbidden-words`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (forbiddenRes.ok) {
          const forbiddenData = await forbiddenRes.json();
          setForbiddenWords(forbiddenData.map(f => f.word));
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetNickname = async () => {
    if (!newNickname.trim() || !selectedMember) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/nicknames`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: parseInt(selectedMember.id), // แปลงเป็น int
          groupId: parseInt(roomId),
          nickname: newNickname,
        }),
      });

      if (res.ok) {
        setNicknames({ ...nicknames, [selectedMember.id]: newNickname });
        setShowNicknameModal(false);
        setNewNickname('');
        setSelectedMember(null);
        setError('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to set nickname');
      }
    } catch (err) {
      console.error('Error setting nickname:', err);
      setError('Failed to set nickname');
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !selectedMember) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: parseInt(selectedMember.id), // แปลงเป็น int
          tagName: newTag,
        }),
      });

      if (res.ok) {
        const existingTags = tags[selectedMember.id] || [];
        setTags({ ...tags, [selectedMember.id]: [...existingTags, newTag] });
        setShowTagModal(false);
        setNewTag('');
        setSelectedMember(null);
        setError('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    }
  };

  const handleAddForbiddenWord = async () => {
    if (!newForbiddenWord.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/groups/${roomId}/forbidden-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: newForbiddenWord.toLowerCase() }),
      });

      if (res.ok) {
        setForbiddenWords([...forbiddenWords, newForbiddenWord.toLowerCase()]);
        setNewForbiddenWord('');
      }
    } catch (err) {
      console.error('Error adding forbidden word:', err);
      setError('Failed to add forbidden word');
    }
  };

  const handleRemoveForbiddenWord = async (word) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/groups/${roomId}/forbidden-words`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word }),
      });

      if (res.ok) {
        setForbiddenWords(forbiddenWords.filter(w => w !== word));
      }
    } catch (err) {
      console.error('Error removing forbidden word:', err);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !connected) return;

    // Check forbidden words
    const lowerMessage = messageInput.toLowerCase();
    const hasForbiddenWord = forbiddenWords.some(word => lowerMessage.includes(word));
    
    if (hasForbiddenWord) {
      setError('⚠️ Your message contains a forbidden word!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    sendMessage(messageInput);
    setMessageInput('');
    setError('');
  };

  const handleLeaveRoom = () => {
    disconnect();
    router.push('/home/mock');
  };

  const getUserDisplayName = (username) => {
    const member = members.find(m => m.username === username);
    if (!member) return username;
    return nicknames[member.id] || username;
  };

  if (!roomId || !username || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading... ⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeaveRoom}
              className="text-2xl hover:scale-110 transition-transform"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold">👥 {groupInfo?.name || 'Group Chat'}</h1>
              <p className="text-sm opacity-90">
                {members.length} members • {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-3xl hover:scale-110 transition-transform"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-purple-50 p-4 border-b-2 border-purple-200">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-bold text-lg mb-3">Group Settings ⚙️</h3>
            <button
              onClick={() => setShowForbiddenModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
            >
              🚫 Forbidden Words ({forbiddenWords.length})
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Members Sidebar */}
        <div className="w-64 bg-white border-r-2 border-gray-200 overflow-y-auto p-4">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Members ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => {
              // ใช้ avatarId จาก groupInfo ถ้ามี ไม่งั้นใช้ default
              const memberInfo = groupInfo?.members?.find(m => m.user.id === parseInt(member.id));
              const avatarId = memberInfo?.user?.avatarId || 1;
              
              return (
                <div
                  key={member.id}
                  className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{AVATARS[avatarId - 1]}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {nicknames[member.id] || member.username}
                      </p>
                      {nicknames[member.id] && (
                        <p className="text-xs text-gray-500">({member.username})</p>
                      )}
                      {tags[member.id] && tags[member.id].length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {tags[member.id].map((tag, i) => (
                            <span key={i} className="text-xs bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {member.username !== username && (
                    <div className="mt-2 hidden group-hover:flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowNicknameModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                      >
                        ✏️ Nickname
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowTagModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-pink-500 text-white rounded hover:bg-pink-600"
                      >
                        🏷️ Tag
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <p className="text-6xl mb-4">💬</p>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender === username;
                return (
                  <div
                    key={index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md ${isMe ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-md`}>
                      {!isMe && (
                        <p className="text-xs font-bold mb-1 opacity-75">
                          {getUserDisplayName(msg.sender)}
                        </p>
                      )}
                      <p className="break-words">{msg.text}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'opacity-75' : 'text-gray-500'}`}>
                        {new Date(msg.ts).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t-2 border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                disabled={!connected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!connected || !messageInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send 📤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Set Nickname for {selectedMember?.username}</h3>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Enter nickname..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSetNickname}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname('');
                  setSelectedMember(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Tag for {selectedMember?.username}</h3>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTag}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setNewTag('');
                  setSelectedMember(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forbidden Words Modal */}
      {showForbiddenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Forbidden Words 🚫</h3>
            <div className="mb-4">
              <input
                type="text"
                value={newForbiddenWord}
                onChange={(e) => setNewForbiddenWord(e.target.value)}
                placeholder="Add forbidden word..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-2"
              />
              <button
                onClick={handleAddForbiddenWord}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
              >
                Add Word
              </button>
            </div>
            {forbiddenWords.length > 0 ? (
              <div className="space-y-2 mb-4">
                {forbiddenWords.map((word, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-mono">{word}</span>
                    <button
                      onClick={() => handleRemoveForbiddenWord(word)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">No forbidden words yet</p>
            )}
            <button
              onClick={() => {
                setShowForbiddenModal(false);
                setNewForbiddenWord('');
              }}
              className="w-full px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}