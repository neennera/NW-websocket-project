export default function ConversationList({
  groups,
  onGroupClick,
  onAddMember,
}) {
  const groupChats = groups.filter((g) => !g.isPrivateChat);
  const dms = groups.filter((g) => g.isPrivateChat);

  if (groups.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          color: '#9B8B7E',
        }}
      >
        <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</p>
        <p
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
          }}
        >
          No groups or DMs yet
        </p>
        <p style={{ fontSize: '0.875rem' }}>
          Click "+ Group" or "+ DM" to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Group Chats Section */}
      {groupChats.length > 0 && (
        <div
          style={{
            marginBottom: groupChats.length > 0 && dms.length > 0 ? '2rem' : 0,
          }}
        >
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#C9A882',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>👥</span>
            <span>Group Chats</span>
          </h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            {groupChats.map((group) => (
              <div
                key={group.id}
                style={{
                  padding: '1.25rem',
                  background:
                    'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(139, 115, 85, 0.1)',
                  border: '1px solid rgba(213, 189, 175, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(139, 115, 85, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(139, 115, 85, 0.1)';
                }}
              >
                <div onClick={() => onGroupClick(group)} style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      color: '#4A4A48',
                      margin: 0,
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>👥</span>
                    <span>{group.name}</span>
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#9B8B7E',
                      margin: 0,
                    }}
                  >
                    {group.membersList && group.membersList.length > 0
                      ? group.membersList.map((m) => m.username).join(', ')
                      : 'Group Chat'}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMember(group);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background:
                        'linear-gradient(135deg, #A8B89E 0%, #8B9E7D 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 6px rgba(168, 184, 158, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 10px rgba(168, 184, 158, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 6px rgba(168, 184, 158, 0.3)';
                    }}
                  >
                    + Member
                  </button>
                  <div
                    onClick={() => onGroupClick(group)}
                    style={{
                      fontSize: '1.5rem',
                      color: '#C9A882',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Messages Section */}
      {dms.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#E8C4B8',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>💌</span>
            <span>Direct Messages</span>
          </h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            {dms.map((dm) => (
              <div
                key={dm.id}
                onClick={() => onGroupClick(dm)}
                style={{
                  padding: '1.25rem',
                  background:
                    'linear-gradient(135deg, #E8C4B8 0%, #F5EBE0 100%)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(232, 196, 184, 0.1)',
                  border: '1px solid rgba(232, 196, 184, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(232, 196, 184, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(232, 196, 184, 0.1)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      color: '#4A4A48',
                      margin: 0,
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>💌</span>
                    <span>{dm.name}</span>
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#9B8B7E',
                      margin: 0,
                    }}
                  >
                    Direct Message
                  </p>
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    color: '#E8C4B8',
                    fontWeight: 'bold',
                  }}
                >
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
