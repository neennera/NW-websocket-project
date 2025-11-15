import { useState } from 'react';

const AVATARS = [
  '😊', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'
];

export default function ProfileCard({ user, onAvatarUpdate }) {
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 1);

  const handleSaveAvatar = async () => {
    await onAvatarUpdate(selectedAvatar);
    setEditingAvatar(false);
  };

  if (!user) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,246,241,0.95) 100%)',
      borderRadius: '20px',
      boxShadow: '0 8px 24px rgba(139, 115, 85, 0.12)',
      padding: '2rem',
      border: '1px solid rgba(227, 213, 202, 0.5)',
      backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem',
        color: '#8B7355',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>👤</span>
        <span>My Profile</span>
      </h2>
      
      <div style={{ textAlign: 'center' }}>
        {/* Avatar Display */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ 
              fontSize: '5rem', 
              marginBottom: '0.5rem',
              padding: '1rem',
            }}>
              {user.avatar_id ? AVATARS[user.avatar_id - 1] : AVATARS[0]}
            </div>
          </div>
          <button
            onClick={() => setEditingAvatar(!editingAvatar)}
            style={{
              background: 'none',
              border: 'none',
              color: '#C9A882',
              fontWeight: '600',
              fontSize: '0.875rem',
              marginTop: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8B7355';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#C9A882';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {editingAvatar ? 'Cancel ❌' : 'Change Avatar ✏️'}
          </button>
        </div>

        {/* Avatar Selector */}
        {editingAvatar && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
            borderRadius: '16px',
            border: '2px solid #D5BDAF'
          }}>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#8B7355',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              🎭 Choose your avatar:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {AVATARS.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(index + 1)}
                  style={{
                    position: 'relative',
                    padding: '1rem',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    border: selectedAvatar === index + 1 
                      ? '3px solid #D4A574' 
                      : '3px solid transparent',
                    background: selectedAvatar === index + 1
                      ? 'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)'
                      : 'white',
                    cursor: 'pointer',
                    boxShadow: selectedAvatar === index + 1
                      ? '0 4px 12px rgba(212, 165, 116, 0.4)'
                      : '0 2px 6px rgba(201, 168, 130, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAvatar !== index + 1) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FAF6F1 0%, #F5EBE0 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAvatar !== index + 1) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{emoji}</div>
                  {selectedAvatar === index + 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: 'white',
                      color: '#D4A574',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(212, 165, 116, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveAvatar}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #C9A882 0%, #D4A574 100%)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(201, 168, 130, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(201, 168, 130, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 168, 130, 0.3)';
              }}
            >
              Save Avatar 💾
            </button>
          </div>
        )}

        {/* User Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'left',
            border: '1px solid #D5BDAF'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#9B8B7E', marginBottom: '0.25rem' }}>Username</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#4A4A48', margin: 0 }}>{user.username}</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #E8C4B8 0%, #E3D5CA 100%)',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'left',
            border: '1px solid #D5BDAF'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#9B8B7E', marginBottom: '0.25rem' }}>Email</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#4A4A48', margin: 0 }}>{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
