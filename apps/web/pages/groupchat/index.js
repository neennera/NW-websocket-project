import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../lib/useWebSocket';

const AVATARS = ['�', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'];

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

  const handleWebSocketMessage = (data) => {
    if (data.type === 'forbidden_word_added') {
      setForbiddenWords((prev) => {
        // Avoid duplicates
        if (prev.includes(data.word)) return prev;
        return [...prev, data.word];
      });
    } else if (data.type === 'forbidden_word_removed') {
      setForbiddenWords((prev) => prev.filter((w) => w !== data.word));
    }
  };

  const { connected, messages, members, sendMessage, disconnect } =
    useWebSocket({
      roomId: roomId ? parseInt(roomId, 10) : null,
      username,
      userId: user?.id,
      onMessage: handleWebSocketMessage,
    });

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/register-login');
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
        const groupRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/groups/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroupInfo(groupData);
        }

        // Fetch nicknames for this group
        const nicknamesRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/nicknames?groupId=${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (nicknamesRes.ok) {
          const nicknamesData = await nicknamesRes.json();
          const nicknamesMap = {};
          nicknamesData.forEach((n) => {
            nicknamesMap[n.userIdTarget] = n.nickname;
          });
          setNicknames(nicknamesMap);
        }

        // Fetch tags
        const tagsRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/tags`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          const tagsMap = {};
          tagsData.forEach((t) => {
            if (!tagsMap[t.userIdTarget]) tagsMap[t.userIdTarget] = [];
            tagsMap[t.userIdTarget].push(t.tagName);
          });
          setTags(tagsMap);
        }

        // Fetch forbidden words
        const forbiddenRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/groups/${roomId}/forbidden-words`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (forbiddenRes.ok) {
          const forbiddenData = await forbiddenRes.json();
          setForbiddenWords(forbiddenData.map((f) => f.word));
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
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/nicknames`,
        {
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
        }
      );

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
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetUserId: parseInt(selectedMember.id), // แปลงเป็น int
            tagName: newTag,
          }),
        }
      );

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
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/${roomId}/forbidden-words`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ word: newForbiddenWord.toLowerCase() }),
        }
      );

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
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/${roomId}/forbidden-words`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ word }),
        }
      );

      if (res.ok) {
        setForbiddenWords(forbiddenWords.filter((w) => w !== word));
      }
    } catch (err) {
      console.error('Error removing forbidden word:', err);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !connected) return;

    // Check forbidden words
    const lowerMessage = messageInput.toLowerCase();
    const hasForbiddenWord = forbiddenWords.some((word) =>
      lowerMessage.includes(word)
    );

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
    router.push('/home');
  };

  const handleLeaveGroup = async () => {
    if (
      !confirm(
        'Are you sure you want to leave this group? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/${roomId}/leave`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        disconnect();
        router.push('/home');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to leave group');
      }
    } catch (err) {
      console.error('Error leaving group:', err);
      setError('Failed to leave group');
    }
  };

  const getUserDisplayName = (username) => {
    const member = members.find((m) => m.username === username);
    if (!member) return username;
    return nicknames[member.id] || username;
  };

  if (!roomId || !username || loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EBE0 100%)',
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            color: '#8B7355',
            fontWeight: '600',
          }}
        >
          Loading... ⏳
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
          color: 'white',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
        }}
      >
        <div
          style={{
            maxWidth: '1536px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleLeaveRoom}
              style={{
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              ←
            </button>
            <div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                👥 {groupInfo?.name || 'Group Chat'}
              </h1>
              <p
                style={{
                  fontSize: '0.875rem',
                  opacity: 0.9,
                  margin: '0.25rem 0 0 0',
                }}
              >
                {members.length} members •{' '}
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              fontSize: '1.875rem',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'scale(1.1)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD5D5 100%)',
            borderLeft: '4px solid #D4756B',
            color: '#8B3A3A',
            padding: '1rem',
          }}
        >
          <p style={{ fontWeight: '600', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
            padding: '1rem',
            borderBottom: '2px solid #D5BDAF',
          }}
        >
          <div style={{ maxWidth: '1536px', margin: '0 auto' }}>
            <h3
              style={{
                fontWeight: '700',
                fontSize: '1.125rem',
                marginBottom: '0.75rem',
                color: '#8B7355',
              }}
            >
              Group Settings ⚙️
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowForbiddenModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background:
                    'linear-gradient(135deg, #D4756B 0%, #B85F56 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(212, 117, 107, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(212, 117, 107, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(212, 117, 107, 0.2)';
                }}
              >
                🚫 Forbidden Words ({forbiddenWords.length})
              </button>
              <button
                onClick={handleLeaveGroup}
                style={{
                  padding: '0.5rem 1rem',
                  background:
                    'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(220, 20, 60, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(220, 20, 60, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(220, 20, 60, 0.2)';
                }}
              >
                🚪 Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Members Sidebar */}
        <div
          style={{
            width: '16rem',
            background: 'linear-gradient(180deg, #FAF6F1 0%, #F5EBE0 100%)',
            borderRight: '2px solid #E3D5CA',
            overflowY: 'auto',
            padding: '1rem',
          }}
        >
          <h3
            style={{
              fontWeight: '700',
              fontSize: '1.125rem',
              marginBottom: '1rem',
              color: '#8B7355',
            }}
          >
            Members ({members.length})
          </h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {members.map((member) => {
              // ใช้ avatarId จาก groupInfo ถ้ามี ไม่งั้นใช้ default
              const memberInfo = groupInfo?.members?.find(
                (m) => m.user.id === parseInt(member.id)
              );
              const avatarId = memberInfo?.user?.avatarId || 1;

              return (
                <div
                  key={member.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(213, 189, 175, 0.3)',
                  }}
                  className="member-card"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>
                      {AVATARS[avatarId - 1]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: '700',
                          color: '#8B7355',
                          margin: 0,
                          fontSize: '0.95rem',
                        }}
                      >
                        {nicknames[member.id] || member.username}
                      </p>
                      {nicknames[member.id] && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#C9A882',
                            margin: '0.125rem 0 0 0',
                          }}
                        >
                          ({member.username})
                        </p>
                      )}
                      {tags[member.id] && tags[member.id].length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.25rem',
                            marginTop: '0.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {tags[member.id].map((tag, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.75rem',
                                background:
                                  'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)',
                                color: '#8B7355',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '9999px',
                                fontWeight: '600',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {member.username !== username && (
                    <div
                      className="member-buttons"
                      style={{
                        marginTop: '0.5rem',
                        display: 'none',
                        gap: '0.25rem',
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowNicknameModal(true);
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background:
                            'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = '0.8')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = '1')
                        }
                      >
                        ✏️ Nickname
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowTagModal(true);
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background:
                            'linear-gradient(135deg, #D4A574 0%, #C9A882 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = '0.8')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = '1')
                        }
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
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #FAF6F1 0%, #F5EBE0 100%)',
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#C9A882',
                  marginTop: '3rem',
                }}
              >
                <p style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>💬</p>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender === username;
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '28rem',
                        background: isMe
                          ? 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)'
                          : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        color: isMe ? 'white' : '#4A4A48',
                        borderRadius: '16px',
                        padding: '0.75rem',
                        boxShadow: isMe
                          ? '0 4px 12px rgba(139, 115, 85, 0.2)'
                          : '0 4px 12px rgba(139, 115, 85, 0.1)',
                        border: isMe
                          ? 'none'
                          : '1px solid rgba(213, 189, 175, 0.3)',
                      }}
                    >
                      {!isMe && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            marginBottom: '0.25rem',
                            opacity: 0.75,
                            color: '#8B7355',
                            margin: '0 0 0.25rem 0',
                          }}
                        >
                          {getUserDisplayName(msg.sender)}
                        </p>
                      )}
                      <p style={{ wordBreak: 'break-word', margin: 0 }}>
                        {msg.text}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          marginTop: '0.25rem',
                          opacity: 0.75,
                          color: isMe ? 'white' : '#8B7355',
                          margin: '0.25rem 0 0 0',
                        }}
                      >
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
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderTop: '2px solid #E3D5CA',
              padding: '1rem',
            }}
          >
            <div
              style={{
                maxWidth: '64rem',
                margin: '0 auto',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="input-field"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #E3D5CA',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  background: 'white',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#C9A882')}
                onBlur={(e) => (e.target.style.borderColor = '#E3D5CA')}
                disabled={!connected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!connected || !messageInput.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background:
                    !connected || !messageInput.trim()
                      ? 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)'
                      : 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                  color: 'white',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  cursor:
                    !connected || !messageInput.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: !connected || !messageInput.trim() ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
                }}
                onMouseEnter={(e) => {
                  if (connected && messageInput.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 6px 16px rgba(139, 115, 85, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (connected && messageInput.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(139, 115, 85, 0.2)';
                  }
                }}
              >
                Send 📤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              boxShadow: '0 20px 60px rgba(139, 115, 85, 0.3)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#8B7355',
              }}
            >
              Set Nickname for {selectedMember?.username}
            </h3>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Enter nickname..."
              className="input-field"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #E3D5CA',
                borderRadius: '12px',
                marginBottom: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C9A882')}
              onBlur={(e) => (e.target.style.borderColor = '#E3D5CA')}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSetNickname}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background:
                    'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(139, 115, 85, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(139, 115, 85, 0.2)';
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname('');
                  setSelectedMember(null);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background:
                    'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
                  color: '#8B7355',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              boxShadow: '0 20px 60px rgba(139, 115, 85, 0.3)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#8B7355',
              }}
            >
              Add Tag for {selectedMember?.username}
            </h3>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag..."
              className="input-field"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #E3D5CA',
                borderRadius: '12px',
                marginBottom: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C9A882')}
              onBlur={(e) => (e.target.style.borderColor = '#E3D5CA')}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAddTag}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background:
                    'linear-gradient(135deg, #D4A574 0%, #C9A882 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(212, 165, 116, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(212, 165, 116, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(212, 165, 116, 0.2)';
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setNewTag('');
                  setSelectedMember(null);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background:
                    'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
                  color: '#8B7355',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forbidden Words Modal */}
      {showForbiddenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(139, 115, 85, 0.3)',
            }}
          >
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#8B7355',
              }}
            >
              Forbidden Words 🚫
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                value={newForbiddenWord}
                onChange={(e) => setNewForbiddenWord(e.target.value)}
                placeholder="Add forbidden word..."
                className="input-field"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #E3D5CA',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#C9A882')}
                onBlur={(e) => (e.target.style.borderColor = '#E3D5CA')}
              />
              <button
                onClick={handleAddForbiddenWord}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background:
                    'linear-gradient(135deg, #D4756B 0%, #B85F56 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(212, 117, 107, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(212, 117, 107, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(212, 117, 107, 0.2)';
                }}
              >
                Add Word
              </button>
            </div>
            {forbiddenWords.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {forbiddenWords.map((word, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      background:
                        'linear-gradient(135deg, #FFE5E5 0%, #FFD5D5 100%)',
                      borderRadius: '8px',
                      border: '1px solid #FFB5B5',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        color: '#8B3A3A',
                        fontWeight: '600',
                      }}
                    >
                      {word}
                    </span>
                    <button
                      onClick={() => handleRemoveForbiddenWord(word)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = 'scale(1.2)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = 'scale(1)')
                      }
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: '#C9A882',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                No forbidden words yet
              </p>
            )}
            <button
              onClick={() => {
                setShowForbiddenModal(false);
                setNewForbiddenWord('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
                color: '#8B7355',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .member-card:hover .member-buttons {
          display: flex !important;
        }
        .member-card:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          box-shadow: 0 4px 12px rgba(139, 115, 85, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
