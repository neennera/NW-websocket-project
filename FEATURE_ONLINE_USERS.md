# Online Users & Group Member Preview Features

## Overview

Two new features have been implemented:

1. **Online Users Display** - Shows a list of users currently connected to the server
2. **Group Member Preview** - Displays usernames in the group list (not just emoji)

---

## Feature 1: Online Users Display

### Backend Changes

#### `apps/api/src/ws/handler.js`

- Added `onlineUsers` Map to track which users are online
- Maps userId → Set of clientIds (handles multiple tabs/devices per user)
- Added `getOnlineUsers()` function to export list of online user IDs
- Modified `handleMessage` to accept `userId` in join message
- Tracks user online status when they connect to any room
- Removes user from online list when all their connections close

**Key Functions:**

```javascript
// Track online users
const onlineUsers = new Map(); // userId -> Set(clientIds)

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}
```

#### `apps/api/src/routes/group.routes.js`

- Added new endpoint: `GET /api/groups/online-users`
- Returns array of online users with id, username, and avatarId
- Requires authentication

**Example Response:**

```json
[
  { "id": 1, "username": "alice", "avatarId": 3 },
  { "id": 5, "username": "bob", "avatarId": 7 }
]
```

### Frontend Changes

#### `apps/web/lib/useWebSocket.js`

- Updated to accept `userId` parameter
- Sends userId when joining WebSocket connection
- Updated dependencies to include userId

**Usage:**

```javascript
const { connected, messages, members } = useWebSocket({
  roomId: 1,
  username: 'alice',
  userId: 123, // NEW: User ID for tracking
  onMessage: handleMessage,
});
```

#### `apps/web/pages/home/index.js`

- Added `onlineUsers` state
- Added `fetchOnlineUsers()` function
- Polls for online users every 10 seconds
- Displays online users section with green pulsing indicator
- Shows user avatar, username, and "(You)" for current user
- Beautiful card-based design with online status indicator

**UI Features:**

- Green pulsing dot animation for "Online Now" indicator
- Count of online users
- Avatar display with small green dot badge
- Auto-refresh every 10 seconds

#### `apps/web/pages/groupchat/index.js`

- Updated useWebSocket call to include `userId: user?.id`

---

## Feature 2: Group Member Preview

### Backend Changes

#### `apps/api/src/routes/group.routes.js`

- Updated `GET /api/groups` endpoint
- Now includes member details in the response
- Each group has `membersList` array with user info

**Modified Response:**

```json
[
  {
    "id": 1,
    "name": "Study Group",
    "isPrivateChat": false,
    "membersList": [
      { "id": 1, "username": "alice", "avatarId": 3 },
      { "id": 2, "username": "bob", "avatarId": 5 }
    ]
  }
]
```

### Frontend Changes

#### `apps/web/components/ConversationList.js`

- Updated group list display
- Shows comma-separated list of member usernames below group name
- Falls back to "Group Chat" if no members loaded

**Example Display:**

```
👥 Study Group
   alice, bob, charlie
```

---

## How It Works

### Online User Tracking Flow

1. **User Opens Website**

   - Frontend calls `fetchOnlineUsers()` on load
   - Sets up polling interval (every 10 seconds)

2. **User Joins Chat Room**

   - WebSocket sends: `{ type: 'join', roomId, username, userId }`
   - Backend adds userId to `onlineUsers` Map
   - Tracks clientId in a Set (handles multiple tabs)

3. **User Disconnects**

   - Backend removes clientId from the user's Set
   - If Set becomes empty, removes userId from `onlineUsers`

4. **Online List Updates**
   - Frontend polls `/api/groups/online-users` every 10 seconds
   - Receives updated list of online users
   - UI automatically updates with new data

### Group Member Preview Flow

1. **User Loads Home Page**

   - Fetches groups via `GET /api/groups`
   - Response includes `membersList` for each group

2. **Display Members**
   - ConversationList component reads `group.membersList`
   - Maps usernames and joins with commas
   - Displays below group name

---

## Visual Design

### Online Users Section

- **Color Scheme**: Green tones (#8B9E83, #A8B89E) for "online" feel
- **Indicator**: Pulsing green dot with glow effect
- **Cards**: White gradient backgrounds with subtle shadows
- **Layout**: Horizontal flex wrap for responsive display
- **Badge**: Small green dot on avatar for online status

### Group Member Preview

- **Location**: Below group name in conversation list
- **Style**: Small, muted text color (#9B8B7E)
- **Format**: "alice, bob, charlie" (comma-separated)
- **Fallback**: Shows "Group Chat" if no members loaded

---

## Testing Guide

### Test Online Users Feature

1. **Open Website in Browser 1**

   - Login as User A
   - Check home page for "Online Now" section
   - Should see yourself listed

2. **Open Website in Browser 2** (or incognito)

   - Login as User B
   - Check home page
   - Both users should see 2 online users

3. **Open Multiple Tabs**

   - Open same user in 3 tabs
   - Should still count as 1 online user

4. **Close Connections**
   - Close all tabs for User B
   - Wait ~10 seconds
   - User A should see only 1 online user

### Test Group Member Preview

1. **Create a Group**

   - Add 3-4 members to a group

2. **Check Home Page**

   - Group list should show group name
   - Below name: "username1, username2, username3"

3. **Join Group**
   - Click on group
   - Verify usernames match actual members

---

## Configuration

### Polling Interval

Default: 10 seconds

To change, edit `apps/web/pages/home/index.js`:

```javascript
const interval = setInterval(fetchOnlineUsers, 10000); // Change 10000 to desired ms
```

### Online Status Persistence

- Online status is **in-memory only**
- Resets when backend restarts
- No database persistence (by design)

---

## API Reference

### GET /api/groups/online-users

**Authentication**: Required (Bearer token)

**Response:**

```json
[
  {
    "id": 1,
    "username": "alice",
    "avatarId": 3
  }
]
```

**Status Codes:**

- 200: Success
- 401: Unauthorized
- 500: Server error

### GET /api/groups

**Authentication**: Required (Bearer token)

**Response:**

```json
[
  {
    "id": 1,
    "name": "Study Group",
    "isPrivateChat": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "membersList": [
      { "id": 1, "username": "alice", "avatarId": 3 },
      { "id": 2, "username": "bob", "avatarId": 5 }
    ]
  }
]
```

---

## Performance Considerations

### Online Users

- **Polling**: 10-second intervals (not real-time)
- **Scalability**: In-memory Map scales well up to ~10,000 users
- **Network**: Minimal overhead (~1-2 KB per request)

### Group Members

- **Database Queries**: Includes JOIN with users table
- **Optimization**: Could add pagination for users with 100+ groups
- **Caching**: Consider Redis cache for member lists if needed

---

## Future Enhancements

### Possible Improvements

1. **Real-time Updates**: Use WebSocket broadcasts instead of polling
2. **Status Messages**: "last seen X minutes ago"
3. **Presence in Rooms**: Show which room each user is in
4. **Typing Indicators**: "User is typing..." feature
5. **Member Avatars**: Show avatar grid instead of text list
6. **Search Filter**: Filter online users by name

---

## Troubleshooting

### Online Users Not Showing

1. Check if WebSocket connection is established
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure backend `/ws` endpoint is accessible

### Member Preview Not Showing

1. Verify group has members in database
2. Check API response includes `membersList`
3. Clear cache and reload page
4. Check browser console for errors

### Incorrect Online Count

1. User might have multiple tabs open (expected)
2. Check backend logs for WebSocket connections
3. Verify `onlineUsers` Map is being updated correctly
4. Test closing all tabs and reopening

---

## Code Locations

### Backend Files

- `apps/api/src/ws/handler.js` - WebSocket online tracking
- `apps/api/src/routes/group.routes.js` - Online users & member list endpoints

### Frontend Files

- `apps/web/lib/useWebSocket.js` - WebSocket hook with userId
- `apps/web/pages/home/index.js` - Online users display
- `apps/web/pages/groupchat/index.js` - Updated WebSocket usage
- `apps/web/components/ConversationList.js` - Member preview display

---

## Database Schema (No Changes)

These features use existing tables:

- `User` table (id, username, avatarId)
- `Group` table (id, name, isPrivateChat)
- `GroupMember` table (userId, groupId)

No migrations required! ✅
