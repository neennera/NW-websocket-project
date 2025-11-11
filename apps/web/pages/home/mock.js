import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AVATARS = [
  '😊', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [error, setError] = useState('');
  
  // New states for creating group/DM
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/register-login/mock');
      return;
    }
    
    fetchProfile();
    fetchGroups();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('📌 User data from API:', data);
      console.log('📌 Avatar ID:', data.avatar_id || data.avatarId);
      // Normalize field names (support both snake_case and camelCase)
      const normalizedUser = {
        ...data,
        avatar_id: data.avatar_id || data.avatarId || 1
      };
      setUser(normalizedUser);
      setSelectedAvatar(normalizedUser.avatar_id);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('401')) {
        router.push('/register-login/mock');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleAvatarUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarId: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      const data = await response.json();
      console.log('📌 Updated user data:', data);
      // Normalize field names
      const normalizedUser = {
        ...data,
        avatar_id: data.avatar_id || data.avatarId || selectedAvatar
      };
      console.log('📌 Normalized user:', normalizedUser);
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser)); // อัพเดท localStorage
      setEditingAvatar(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/register-login/mock');
  };

  const handleGroupClick = (group) => {
    // Navigate to group chat
    if (group.is_dm) {
      router.push(`/chat/mock?roomId=${group.id}&username=${user.username}`);
    } else {
      router.push(`/groupchat/mock?roomId=${group.id}&username=${user.username}`);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await response.json();
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowCreateGroup(false);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSearchUsers = async (searchText) => {
    const textToSearch = searchText || searchUsername;
    
    if (!textToSearch.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // ตรวจสอบว่าเป็นตัวเลข (userID) หรือไม่
      const isNumeric = /^\d+$/.test(textToSearch.trim());
      const searchParam = isNumeric 
        ? `userId=${textToSearch.trim()}` 
        : `username=${textToSearch.trim()}`;
      
      const url = `http://localhost:3001/api/profile/search?${searchParam}`;
      console.log('🔍 Searching with URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error('Failed to search users');
      }

      const results = await response.json();
      console.log('✅ Search results:', results);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    }
  };

  const handleStartDM = async (targetUserId) => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/groups/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start DM');
      }

      const dmGroup = await response.json();
      
      // Check if DM already exists in groups
      const existingDM = groups.find(g => g.id === dmGroup.id);
      if (!existingDM) {
        setGroups([...groups, dmGroup]);
      }
      
      setShowStartDM(false);
      setSearchUsername('');
      setSearchResults([]);
      setError('');
      
      // Navigate to the DM
      router.push(`/chat/mock?groupId=${dmGroup.id}`);
    } catch (err) {
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
      const response = await fetch(`http://localhost:3001/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add member';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (HTML error page)
          const errorText = await response.text();
          console.error('Server error:', errorText);
          errorMessage = 'Server error. Please make sure the backend is running.';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Member added:', result);
      
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading... ⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My Dashboard 🏠
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout 👋
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">My Profile 👤</h2>
              
              {user && (
                <div className="text-center">
                  {/* Avatar */}
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <div className="text-8xl mb-2">
                        {user.avatar_id ? AVATARS[user.avatar_id - 1] : AVATARS[0]}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Selected
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAvatar(!editingAvatar)}
                      className="text-purple-600 hover:text-purple-700 font-semibold text-sm mt-2 block mx-auto"
                    >
                      {editingAvatar ? 'Cancel ❌' : 'Change Avatar ✏️'}
                    </button>
                  </div>

                  {/* Avatar Selector */}
                  {editingAvatar && (
                    <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3 font-semibold">Choose your avatar:</p>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {AVATARS.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedAvatar(index + 1)}
                            className={`relative p-3 rounded-lg transition-all hover:scale-110 ${
                              selectedAvatar === index + 1 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 ring-4 ring-purple-300 shadow-lg' 
                                : 'bg-white hover:bg-purple-100'
                            }`}
                          >
                            <div className="text-3xl">{emoji}</div>
                            {selectedAvatar === index + 1 && (
                              <div className="absolute -top-1 -right-1 bg-white text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                ✓
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleAvatarUpdate}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        Save Avatar 💾
                      </button>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="space-y-3 text-left">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="text-lg font-bold text-gray-800">{user.username}</p>
                    </div>
                    <div className="bg-pink-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-bold text-gray-800">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Groups & DMs */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">My Conversations 💬</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-semibold"
                  >
                    + Group
                  </button>
                  <button
                    onClick={() => setShowStartDM(true)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all text-sm font-semibold"
                  >
                    + DM
                  </button>
                </div>
              </div>

              {/* Create Group Modal */}
              {showCreateGroup && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">Create New Group 👥</h3>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="input-field mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateGroup}
                      disabled={creating}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create Group'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setNewGroupName('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Start DM Modal */}
              {showStartDM && (
                <div className="mb-4 p-4 bg-pink-50 rounded-lg border-2 border-pink-200">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">Start Direct Message 💌</h3>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={searchUsername}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchUsername(value);
                        handleSearchUsers(value);
                      }}
                      placeholder="Search by username or user ID..."
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Enter username (e.g. "john") or user ID (e.g. "123")
                    </p>
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mb-3 max-h-48 overflow-y-auto space-y-2">
                      {searchResults.map((foundUser) => (
                        <div
                          key={foundUser.id}
                          onClick={() => handleStartDM(foundUser.id)}
                          className="p-3 bg-white rounded-lg hover:bg-pink-100 cursor-pointer transition-all flex items-center gap-3"
                        >
                          <div className="text-3xl">{AVATARS[(foundUser.avatarId || foundUser.avatar_id || 1) - 1]}</div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{foundUser.username}</p>
                            <p className="text-sm text-gray-600">{foundUser.email}</p>
                          </div>
                          <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-mono">
                            ID: {foundUser.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchUsername && searchResults.length === 0 && (
                    <p className="text-gray-500 text-sm mb-3">No users found</p>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowStartDM(false);
                      setSearchUsername('');
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Add Member Modal */}
              {showAddMember && selectedGroup && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">
                    Add Member to "{selectedGroup.name}" 👥
                  </h3>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={searchUsername}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchUsername(value);
                        handleSearchUsers(value);
                      }}
                      placeholder="Search by username or user ID..."
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Search for a friend to add to the group
                    </p>
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mb-3 max-h-48 overflow-y-auto space-y-2">
                      {searchResults.map((foundUser) => (
                        <div
                          key={foundUser.id}
                          onClick={() => handleAddMemberToGroup(foundUser.id)}
                          className="p-3 bg-white rounded-lg hover:bg-green-100 cursor-pointer transition-all flex items-center gap-3"
                        >
                          <div className="text-3xl">{AVATARS[(foundUser.avatarId || foundUser.avatar_id || 1) - 1]}</div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{foundUser.username}</p>
                            <p className="text-sm text-gray-600">{foundUser.email}</p>
                          </div>
                          <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                            + Add
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchUsername && searchResults.length === 0 && (
                    <p className="text-gray-500 text-sm mb-3">No users found</p>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedGroup(null);
                      setSearchUsername('');
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {groups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-6xl mb-4">📭</p>
                  <p className="text-lg">No groups or DMs yet</p>
                  <p className="text-sm mt-2">Click "+ Group" or "+ DM" to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all transform hover:scale-102 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          onClick={() => handleGroupClick(group)}
                          className="flex-1 cursor-pointer"
                        >
                          <h3 className="font-bold text-lg text-gray-800">
                            {group.is_dm ? '💌' : '👥'} {group.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.is_dm ? 'Direct Message' : 'Group Chat'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!group.is_dm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroup(group);
                                setShowAddMember(true);
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-semibold"
                              title="Add member to group"
                            >
                              + Member
                            </button>
                          )}
                          <div 
                            onClick={() => handleGroupClick(group)}
                            className="text-3xl cursor-pointer"
                          >
                            →
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center">
                <p className="text-3xl font-bold">{groups.filter(g => !g.is_dm).length}</p>
                <p className="text-sm">Groups 👥</p>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-4 text-white text-center">
                <p className="text-3xl font-bold">{groups.filter(g => g.is_dm).length}</p>
                <p className="text-sm">DMs 💌</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
}
