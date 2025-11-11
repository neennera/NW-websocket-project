export default function ConversationStats({ groups }) {
  const groupCount = groups.filter(g => !g.isPrivateChat).length;
  const dmCount = groups.filter(g => g.isPrivateChat).length;

  return (
    <div style={{ 
      marginTop: '1.5rem', 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: '1rem' 
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(139, 115, 85, 0.3)'
      }}>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
          {groupCount}
        </p>
        <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
          Groups 👥
        </p>
      </div>
      <div style={{
        background: 'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(232, 196, 184, 0.3)'
      }}>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
          {dmCount}
        </p>
        <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
          DMs 💌
        </p>
      </div>
    </div>
  );
}
