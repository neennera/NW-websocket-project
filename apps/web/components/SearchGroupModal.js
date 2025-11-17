import { useState, useEffect } from 'react';

const AVATARS = ['😊', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'];

export default function SearchGroupModal({ show, onClose, onJoinSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      handleSearch();
    }
  }, [show]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = searchQuery
        ? `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/groups/search?name=${encodeURIComponent(searchQuery)}`
        : `${
            process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          }/api/groups/search`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setError('Failed to search groups');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setJoining(groupId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api/groups/${groupId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh search results
        await handleSearch();
        // Notify parent to refresh groups list
        if (onJoinSuccess) onJoinSuccess();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to join group');
      }
    } catch (err) {
      console.error('Join error:', err);
      setError('Failed to join group');
    } finally {
      setJoining(null);
    }
  };

  if (!show) return null;

  return (
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
          maxWidth: '36rem',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(139, 115, 85, 0.3)',
        }}
      >
        {/* Header */}
        <h3
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: '#8B7355',
          }}
        >
          🔍 Search Groups
        </h3>

        {/* Search Input */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search group name..."
              className="input-field"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #E3D5CA',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C9A882')}
              onBlur={(e) => (e.target.style.borderColor = '#E3D5CA')}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(139, 115, 85, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(139, 115, 85, 0.2)';
                }
              }}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD5D5 100%)',
              borderLeft: '4px solid #D4756B',
              color: '#8B3A3A',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            minHeight: '200px',
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#C9A882',
              }}
            >
              Loading...
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#C9A882',
              }}
            >
              <p style={{ fontSize: '3rem', margin: '0 0 0.5rem 0' }}>🔍</p>
              <p>No groups found</p>
            </div>
          ) : (
            searchResults.map((group) => (
              <div
                key={group.id}
                style={{
                  padding: '1rem',
                  background: group.isMember
                    ? 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)'
                    : 'linear-gradient(135deg, #FAF6F1 0%, #F5EBE0 100%)',
                  borderRadius: '16px',
                  border: `2px solid ${group.isMember ? '#C9A882' : '#E3D5CA'}`,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#8B7355',
                      }}
                    >
                      {group.name}
                    </h4>
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#C9A882',
                      }}
                    >
                      👥 {group.memberCount} members
                    </p>
                  </div>

                  {group.isMember ? (
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        background:
                          'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                      }}
                    >
                      ✓ Joined
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joining === group.id}
                      style={{
                        padding: '0.5rem 1rem',
                        background:
                          joining === group.id
                            ? 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)'
                            : 'linear-gradient(135deg, #A8B89E 0%, #8B9E83 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: joining === group.id ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(168, 184, 158, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        if (joining !== group.id) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 12px rgba(168, 184, 158, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (joining !== group.id) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow =
                            '0 2px 8px rgba(168, 184, 158, 0.2)';
                        }
                      }}
                    >
                      {joining === group.id ? 'Joining...' : '+ Join'}
                    </button>
                  )}
                </div>

                {/* Member Avatars Preview */}
                {group.members && group.members.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {group.members.slice(0, 8).map((member, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '1.25rem',
                          opacity: 0.8,
                        }}
                        title={member.user.username}
                      >
                        {AVATARS[member.user.avatarId - 1] || '😊'}
                        {member.user.username}
                      </span>
                    ))}
                    {group.members.length > 8 && (
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: '#C9A882',
                          alignSelf: 'center',
                          marginLeft: '0.25rem',
                        }}
                      >
                        +{group.members.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.75rem',
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
  );
}
