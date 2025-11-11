export default function CreateGroupModal({ 
  show, 
  groupName, 
  creating, 
  onGroupNameChange, 
  onCreate, 
  onCancel 
}) {
  if (!show) return null;

  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
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
        <span>👥</span>
        <span>Create New Group</span>
      </h3>
      <input
        type="text"
        value={groupName}
        onChange={(e) => onGroupNameChange(e.target.value)}
        placeholder="Enter group name..."
        className="input-field"
        style={{ marginBottom: '1rem' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onCreate}
          disabled={creating}
          style={{
            flex: 1,
            background: creating 
              ? 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)'
              : 'linear-gradient(135deg, #C9A882 0%, #D4A574 100%)',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            cursor: creating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(201, 168, 130, 0.3)',
            opacity: creating ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!creating) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 168, 130, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!creating) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(201, 168, 130, 0.3)';
            }
          }}
        >
          {creating ? 'Creating...' : 'Create Group'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
            color: '#4A4A48',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
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
    </div>
  );
}
