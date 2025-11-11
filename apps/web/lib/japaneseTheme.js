// Japanese Earth Tone Theme Styles
export const colors = {
  cream: '#F5EBE0',
  lightBeige: '#E3D5CA',
  mediumBeige: '#D5BDAF',
  warmBrown: '#C9A882',
  darkBrown: '#8B7355',
  softTerracotta: '#D4A574',
  mutedPink: '#E8C4B8',
  sageGreen: '#A8B89E',
  warmWhite: '#FAF6F1',
  charcoal: '#4A4A48',
};

export const gradients = {
  warm: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
  cozy: 'linear-gradient(135deg, #C9A882 0%, #D4A574 100%)',
  soft: 'linear-gradient(135deg, #E8C4B8 0%, #D4A574 100%)',
  background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 50%, #D5BDAF 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,246,241,0.95) 100%)',
  brown: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
  beige: 'linear-gradient(135deg, #E3D5CA 0%, #D5BDAF 100%)',
};

export const styles = {
  // Card styles
  card: {
    background: gradients.card,
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(139, 115, 85, 0.12)',
    padding: '2rem',
    border: '1px solid rgba(227, 213, 202, 0.5)',
    backdropFilter: 'blur(10px)',
  },

  // Button styles
  button: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  buttonPrimary: {
    background: gradients.cozy,
    boxShadow: '0 4px 12px rgba(201, 168, 130, 0.3)',
  },

  buttonSecondary: {
    background: gradients.soft,
    boxShadow: '0 2px 8px rgba(232, 196, 184, 0.3)',
  },

  // Input styles
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: `2px solid ${colors.lightBeige}`,
    background: colors.warmWhite,
    color: colors.charcoal,
    transition: 'all 0.3s ease',
  },

  // Modal styles
  modal: {
    padding: '1.5rem',
    background: gradients.warm,
    borderRadius: '16px',
    border: `2px solid ${colors.mediumBeige}`,
    marginBottom: '1.5rem',
  },

  // Group/DM Item styles
  groupItem: {
    padding: '1.25rem',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(139, 115, 85, 0.1)',
    border: '1px solid rgba(213, 189, 175, 0.3)',
  },

  groupItemGroup: {
    background: 'linear-gradient(135deg, #F5EBE0 0%, #E3D5CA 100%)',
  },

  groupItemDM: {
    background: 'linear-gradient(135deg, #E8C4B8 0%, #F5EBE0 100%)',
  },

  // Header styles
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: gradients.card,
    padding: '1.5rem 2rem',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(139, 115, 85, 0.1)',
    border: '1px solid rgba(227, 213, 202, 0.5)',
  },

  // Title styles
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: gradients.brown,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: colors.darkBrown,
    margin: 0,
  },

  subsectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: colors.warmBrown,
  },
};

// Text content (English with Japanese theme)
export const text = {
  dashboard: 'My Dashboard',
  myProfile: 'My Profile',
  conversations: 'My Conversations',
  logout: 'Logout',
  username: 'Username',
  email: 'Email',
  changeAvatar: 'Change Avatar',
  cancel: 'Cancel',
  save: 'Save',
  selectAvatar: 'Choose your avatar',
  createGroup: 'Create Group',
  newGroup: 'Create New Group',
  groupName: 'Enter group name...',
  creating: 'Creating...',
  startDM: 'Start DM',
  newDM: 'Start Direct Message',
  search: 'Search',
  searchPlaceholder: 'Search by username or user ID...',
  noResults: 'No users found',
  addMember: 'Add Member',
  addMemberTo: 'Add Member to',
  groupChats: 'Group Chats',
  directMessages: 'Direct Messages',
  noConversations: 'No groups or DMs yet',
  getStarted: 'Click "+ Group" or "+ DM" to get started!',
  groups: 'Groups',
  dms: 'DMs',
  selected: 'Selected',
  tip: 'Tip: Enter username (e.g. "john") or user ID (e.g. "123")',
  searchFriend: 'Search for a friend to add to the group',
};

// Helper function for hover effects
export const hoverEffect = {
  scale: (e, scale = 1.02) => {
    e.currentTarget.style.transform = `scale(${scale})`;
  },
  translateY: (e, y = -2) => {
    e.currentTarget.style.transform = `translateY(${y}px)`;
  },
  reset: (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
  },
  shadowIncrease: (e, from, to) => {
    e.currentTarget.style.boxShadow = to;
  },
  shadowReset: (e, shadow) => {
    e.currentTarget.style.boxShadow = shadow;
  },
};
