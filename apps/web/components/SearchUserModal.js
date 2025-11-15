const AVATARS = [
  '😊', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'
];

export default function SearchUserModal({ 
  show, 
  title,
  searchValue, 
  searchResults, 
  onSearchChange, 
  onUserSelect, 
  onCancel,
  placeholder = "Search by username or user ID...",
  tipText = "💡 Tip: Enter username (e.g. \"john\") or user ID (e.g. \"123\")",
  primaryColor = '#E8C4B8',
  secondaryColor = '#D4A574'
}) {
  if (!show) return null;

  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1.5rem',
      background: `linear-gradient(135deg, ${primaryColor} 0%, #F5EBE0 100%)`,
      borderRadius: '16px',
      border: '2px solid #D5BDAF'
    }}>
      <h3 style={{ 
        fontWeight: 'bold', 
        fontSize: '1.125rem', 
        marginBottom: '1rem',
        color: '#8B7355',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {title}
      </h3>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
        />
        <p style={{ fontSize: '0.75rem', color: '#9B8B7E', marginTop: '0.5rem' }}>
          {tipText}
        </p>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={{ 
          marginBottom: '1rem', 
          maxHeight: '250px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {searchResults.map((foundUser) => (
            <div
              key={foundUser.id}
              onClick={() => onUserSelect(foundUser.id)}
              style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                border: '1px solid #E3D5CA'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor} 0%, #FAF6F1 100%)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 168, 130, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>
                {AVATARS[(foundUser.avatarId || foundUser.avatar_id || 1) - 1]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 'bold', color: '#4A4A48', margin: 0, marginBottom: '0.25rem' }}>
                  {foundUser.username}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#9B8B7E', margin: 0 }}>
                  {foundUser.email}
                </p>
              </div>
              <div style={{
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
                color: '#8B7355',
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontWeight: '600'
              }}>
                ID: {foundUser.id}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchValue && searchResults.length === 0 && (
        <p style={{ color: '#9B8B7E', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
          No users found
        </p>
      )}
      
      <button
        onClick={onCancel}
        style={{
          width: '100%',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
          color: '#4A4A48',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontWeight: '600'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)';
          e.currentTarget.style.color = '#4A4A48';
        }}
      >
        Cancel
      </button>
    </div>
  );
}
