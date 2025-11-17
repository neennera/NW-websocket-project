import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProfileCard from '../../components/ProfileCard';
import CreateGroupModal from '../../components/CreateGroupModal';
import SearchUserModal from '../../components/SearchUserModal';
import SearchGroupModal from '../../components/SearchGroupModal';
import ConversationList from '../../components/ConversationList';
import ConversationStats from '../../components/ConversationStats';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSearchGroup, setShowSearchGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/register-login');
      return;
    }

    fetchProfile();
    fetchGroups();
    fetchOnlineUsers();

    // Poll for online users every 10 seconds
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/profile/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      const normalizedUser = {
        ...data,
        avatar_id: data.avatar_id || data.avatarId || 1,
      };
      setUser(normalizedUser);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('401')) {
        router.push('/register-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/online-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch online users');
      }

      const data = await response.json();
      setOnlineUsers(data);
    } catch (err) {
      console.error('Error fetching online users:', err);
    }
  };

  const handleAvatarUpdate = async (avatarId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/profile/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      const updatedUser = await response.json();
      const normalizedUser = {
        ...updatedUser,
        avatar_id: updatedUser.avatar_id || updatedUser.avatarId,
      };
      setUser(normalizedUser);

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.avatar_id = avatarId;
      localStorage.setItem('user', JSON.stringify(storedUser));

      alert('✅ Avatar updated successfully!');
    } catch (err) {
      setError(err.message);
      alert('❌ Failed to update avatar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/register-login');
  };

  const handleGroupClick = (group) => {
    // Navigate to chat page with roomId and username as query params
    const username = user?.username || 'User';
    router.push(
      `/groupchat?roomId=${group.id}&username=${encodeURIComponent(username)}`
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('⚠️ Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newGroupName }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      await fetchGroups();
      setShowCreateGroup(false);
      setNewGroupName('');
      setError('');
      alert('✅ Group created successfully!');
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSearchUsers = async (searchText) => {
    if (!searchText || searchText.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const isNumeric = /^\d+$/.test(searchText.trim());
      const searchParam = isNumeric
        ? `userId=${searchText.trim()}`
        : `username=${encodeURIComponent(searchText.trim())}`;

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/profile/search?${searchParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    }
  };

  const handleStartDM = async (userId) => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/dm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otherUserId: userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start DM');
      }

      const dm = await response.json();
      setShowStartDM(false);
      setSearchUsername('');
      setSearchResults([]);
      setError('');
      // Navigate to chat with DM room
      const username = user?.username || 'User';
      router.push(
        `/groupchat?roomId=${dm.id}&username=${encodeURIComponent(username)}`
      );
    } catch (err) {
      console.error('Error starting DM:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAddMemberToGroup = async (userId) => {
    if (!selectedGroup) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/${selectedGroup.id}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to add member';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          errorMessage =
            'Server error. Please make sure the backend is running.';
        }
        throw new Error(errorMessage);
      }

      setShowAddMember(false);
      setSearchUsername('');
      setSearchResults([]);
      setSelectedGroup(null);
      setError('');
      alert('✅ Member added successfully!');
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 50%, #D5BDAF 100%)',
        }}
      >
        <div style={{ fontSize: '2rem', color: '#8B7355' }}>Loading... ⏳</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 50%, #D5BDAF 100%)',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            padding: '1.5rem 2rem',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(139, 115, 85, 0.1)',
            border: '1px solid rgba(227, 213, 202, 0.5)',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: 0,
            }}
          >
            <span style={{ fontSize: '2rem' }}>🏠</span>
            My Dashboard
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 16px rgba(212, 165, 116, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(212, 165, 116, 0.3)';
            }}
          >
            <span>Logout</span>
            <span>👋</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
              borderLeft: '4px solid #E8C4B8',
              color: '#721c24',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(232, 196, 184, 0.2)',
            }}
          >
            <p style={{ fontWeight: '600', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) 2fr',
            gap: '1.5rem',
          }}
        >
          {/* Profile Card */}
          <div>
            <ProfileCard user={user} onAvatarUpdate={handleAvatarUpdate} />
          </div>

          {/* Conversations */}
          <div>
            {/* Online Users Section */}
            {onlineUsers.length > 0 && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(168, 184, 158, 0.15) 0%, rgba(139, 158, 131, 0.15) 100%)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(139, 115, 85, 0.08)',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(168, 184, 158, 0.3)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#8B9E83',
                    margin: 0,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#4ade80',
                      boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  ></span>
                  <span>Online Now ({onlineUsers.length})</span>
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  {onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.id}
                      style={{
                        padding: '0.5rem 1rem',
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid rgba(168, 184, 158, 0.2)',
                        boxShadow: '0 2px 6px rgba(139, 115, 85, 0.05)',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, #A8B89E 0%, #8B9E83 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          position: 'relative',
                        }}
                      >
                        {onlineUser.avatarId
                          ? String.fromCodePoint(
                              0x1f600 + (onlineUser.avatarId % 80)
                            )
                          : '👤'}
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            background: '#4ade80',
                            border: '2px solid white',
                            borderRadius: '50%',
                          }}
                        ></span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#4A4A48',
                        }}
                      >
                        {onlineUser.username}
                        {onlineUser.id === user?.id && ' (You)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,246,241,0.95) 100%)',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(139, 115, 85, 0.12)',
                padding: '2rem',
                border: '1px solid rgba(227, 213, 202, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#8B7355',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>💬</span>
                  <span>My Conversations</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowSearchGroup(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      background:
                        'linear-gradient(135deg, #A8B89E 0%, #8B9E83 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(168, 184, 158, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 12px rgba(168, 184, 158, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(168, 184, 158, 0.3)';
                    }}
                  >
                    🔍 Join Group
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      background:
                        'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(139, 115, 85, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 12px rgba(139, 115, 85, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(139, 115, 85, 0.3)';
                    }}
                  >
                    + Create Group
                  </button>
                  <button
                    onClick={() => setShowStartDM(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      background:
                        'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(139, 115, 85, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 12px rgba(139, 115, 85, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(232, 196, 184, 0.3)';
                    }}
                  >
                    + Start DM
                  </button>
                </div>
              </div>

              {/* Modals */}
              <CreateGroupModal
                show={showCreateGroup}
                groupName={newGroupName}
                creating={creating}
                onGroupNameChange={setNewGroupName}
                onCreate={handleCreateGroup}
                onCancel={() => {
                  setShowCreateGroup(false);
                  setNewGroupName('');
                }}
              />

              <SearchUserModal
                show={showStartDM}
                title={
                  <>
                    <span>💌</span> <span>Start Direct Message</span>
                  </>
                }
                searchValue={searchUsername}
                searchResults={searchResults}
                onSearchChange={(value) => {
                  setSearchUsername(value);
                  handleSearchUsers(value);
                }}
                onUserSelect={handleStartDM}
                onCancel={() => {
                  setShowStartDM(false);
                  setSearchUsername('');
                  setSearchResults([]);
                }}
                primaryColor="#E8C4B8"
                secondaryColor="#D4A574"
              />

              <SearchUserModal
                show={showAddMember}
                title={
                  <>
                    <span>👥</span>{' '}
                    <span>Add Member to "{selectedGroup?.name}"</span>
                  </>
                }
                searchValue={searchUsername}
                searchResults={searchResults}
                onSearchChange={(value) => {
                  setSearchUsername(value);
                  handleSearchUsers(value);
                }}
                onUserSelect={handleAddMemberToGroup}
                onCancel={() => {
                  setShowAddMember(false);
                  setSelectedGroup(null);
                  setSearchUsername('');
                  setSearchResults([]);
                }}
                tipText="💡 Search for a friend to add to the group"
                primaryColor="#A8B89E"
                secondaryColor="#8B9E7D"
              />

              <SearchGroupModal
                show={showSearchGroup}
                onClose={() => setShowSearchGroup(false)}
                onJoinSuccess={() => {
                  fetchGroups();
                  setShowSearchGroup(false);
                }}
              />

              {/* Conversation List */}
              <ConversationList
                groups={groups}
                onGroupClick={handleGroupClick}
                onAddMember={(group) => {
                  setSelectedGroup(group);
                  setShowAddMember(true);
                }}
              />
            </div>

            {/* Stats */}
            <ConversationStats groups={groups} />
          </div>
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#C9A882',
              borderRadius: '50%',
              animation: 'bounce 1.5s ease-in-out infinite',
            }}
          ></div>
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#E8C4B8',
              borderRadius: '50%',
              animation: 'bounce 1.5s ease-in-out 0.1s infinite',
            }}
          ></div>
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#C9A882',
              borderRadius: '50%',
              animation: 'bounce 1.5s ease-in-out 0.2s infinite',
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
