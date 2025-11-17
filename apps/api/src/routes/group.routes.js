const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticateToken } = require('../auth.middleware.js');
const { getOnlineUsers } = require('../ws/handler.js');

const router = express.Router();
const prisma = new PrismaClient();

// GET /groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const memberships = await prisma.groupMember.findMany({
      where: { userId: userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, avatarId: true },
                },
              },
            },
          },
        },
      },
    });
    const groups = memberships.map((m) => ({
      ...m.group,
      membersList: m.group.members.map((member) => member.user),
    }));
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /groups/search - Search for public groups to join
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.query;

    // Find all public groups (not private chats)
    const whereClause = {
      isPrivateChat: false,
    };

    // Add name filter if provided
    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    const publicGroups = await prisma.group.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add 'isMember' flag for each group
    const groupsWithMemberStatus = publicGroups.map((group) => ({
      ...group,
      isMember: group.members.some((m) => m.userId === userId),
      memberCount: group.members.length,
    }));

    res.json(groupsWithMemberStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /groups/online-users - Get list of currently connected users
router.get('/online-users', authenticateToken, async (req, res) => {
  try {
    const onlineUserIds = getOnlineUsers();
    console.log('🔍 GET /online-users - Online user IDs from WebSocket:', onlineUserIds);

    // Disable caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Fetch user details for online users
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: onlineUserIds,
        },
      },
      select: {
        id: true,
        username: true,
        avatarId: true,
      },
    });

    console.log('🔍 GET /online-users - Returning users:', users);
    res.json(users);
  } catch (error) {
    console.error('❌ Error in GET /online-users:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/online-users-by-ids - Get user details for specific user IDs
router.post('/online-users-by-ids', authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;
    console.log('🔍 POST /online-users-by-ids - Received userIds:', userIds);

    if (!userIds || !Array.isArray(userIds)) {
      console.error('❌ POST /online-users-by-ids - Invalid userIds:', userIds);
      return res.status(400).json({ error: 'userIds array is required' });
    }

    // Disable caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Fetch user details for provided user IDs
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        username: true,
        avatarId: true,
      },
    });

    console.log('🔍 POST /online-users-by-ids - Returning users:', users);
    res.json(users);
  } catch (error) {
    console.error('❌ Error in POST /online-users-by-ids:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /groups/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);

    // Check if user is a member
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group.' });
    }

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatarId: true },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    const newGroup = await prisma.group.create({
      data: {
        name: name,
        isPrivateChat: false,
        members: {
          create: [{ userId: userId }],
        },
      },
    });
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/dm
router.post('/dm', authenticateToken, async (req, res) => {
  try {
    const selfUserId = req.user.userId;
    const targetUserId = parseInt(req.body.otherUserId); // แปลงเป็น integer

    if (!targetUserId) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (selfUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot create DM with yourself.' });
    }

    const existingGroup = await prisma.group.findFirst({
      where: {
        isPrivateChat: true,
        AND: [
          { members: { some: { userId: selfUserId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (existingGroup) {
      return res.json(existingGroup);
    }

    // Fetch usernames for both users
    const [selfUser, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: selfUserId },
        select: { username: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { username: true },
      }),
    ]);

    if (!selfUser || !targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newDM = await prisma.group.create({
      data: {
        name: `DM_${selfUser.username}_${targetUser.username}`,
        isPrivateChat: true,
        members: {
          create: [{ userId: selfUserId }, { userId: targetUserId }],
        },
      },
    });
    res.status(201).json(newDM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/:id/join
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id); // :id จาก URL

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group.isPrivateChat) {
      return res.status(403).json({ error: 'Cannot join a private chat.' });
    }

    const newMembership = await prisma.groupMember.create({
      data: {
        userId: userId,
        groupId: groupId,
      },
    });

    res.status(201).json(newMembership); // 201 = Created
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ error: 'You are already a member of this group.' });
    }
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Group not found.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/:id/members - เพิ่มสมาชิกเข้ากลุ่ม (สำหรับเจ้าของกลุ่ม)
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const inviterId = req.user.userId;
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // ตรวจสอบว่ากลุ่มนี้ไม่ใช่ DM
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (group.isPrivateChat) {
      return res
        .status(403)
        .json({ error: 'Cannot add members to a private chat' });
    }

    // ตรวจสอบว่าผู้เชิญเป็นสมาชิกของกลุ่ม
    const inviterMembership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: inviterId, groupId } },
    });
    if (!inviterMembership) {
      return res
        .status(403)
        .json({ error: 'You must be a member to invite others' });
    }

    // ตรวจสอบว่าผู้ที่จะเพิ่มยังไม่ได้เป็นสมาชิก
    const existingMembership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: parseInt(userId), groupId } },
    });
    if (existingMembership) {
      return res
        .status(400)
        .json({ error: 'User is already a member of this group' });
    }

    // เพิ่มสมาชิกใหม่
    const newMembership = await prisma.groupMember.create({
      data: {
        userId: parseInt(userId),
        groupId: groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarId: true,
          },
        },
      },
    });

    res.status(201).json(newMembership);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /groups/:id/messages
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group.' });
    }

    const messages = await prisma.message.findMany({
      where: { groupId: groupId },
      orderBy: { createdAt: 'asc' },
      //   take: 50, // (Optional) Limit to last 50 messages
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/:id/messages
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
      return res
        .status(400)
        .json({ error: 'Message content cannot be empty.' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group.' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: content,
        userId: userId,
        groupId: groupId,
      },
    });

    res.status(201).json(newMessage); // 201 = Created
  } catch (error) {
    console.error('Error in POST /messages:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while sending the message.' });
  }
});

// DELETE /groups/:id/leave - Leave a group
router.delete('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);

    // Check if the group exists
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // Check if user is a member
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group.' });
    }

    // For DM (Private Chat), delete everything when anyone leaves
    if (group.isPrivateChat) {
      // Delete all messages first (due to foreign key constraint)
      await prisma.message.deleteMany({ where: { groupId } });
      // Delete all memberships
      await prisma.groupMember.deleteMany({ where: { groupId } });
      // Delete the group
      await prisma.group.delete({ where: { id: groupId } });
      return res.json({ message: 'Left DM and conversation was deleted.' });
    }

    // For regular groups, just remove the member
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    // Check if the group is now empty and delete it if so
    const remainingMembers = await prisma.groupMember.count({
      where: { groupId },
    });

    if (remainingMembers === 0) {
      // Delete all messages first (due to foreign key constraint)
      await prisma.message.deleteMany({ where: { groupId } });
      // Delete the group
      await prisma.group.delete({ where: { id: groupId } });
      return res.json({ message: 'Left group and group was deleted (empty).' });
    }

    res.json({ message: 'Successfully left the group.' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
