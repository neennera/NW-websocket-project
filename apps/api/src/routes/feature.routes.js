const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../auth.middleware.js');

const router = express.Router();
const prisma = new PrismaClient();

// --- (Internal Function) ---
// Check if a user is a member of a group
async function isUserMember(userId, groupId) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return !!member; // Return true if found, false if not found
}

// ========== API: Tags (Feature 3) ==========

// POST /tags
router.post('/tags', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const { targetUserId, tagName } = req.body;

    const newTag = await prisma.userTag.create({
      data: {
        userIdSetter: userIdSetter,
        userIdTarget: targetUserId,
        tagName: tagName,
      },
    });
    res.status(201).json(newTag);
  } catch (error) {
    if (error.code === 'P2002')
      return res.status(400).json({ error: 'Tag already exists.' });
    res.status(500).json({ error: error.message });
  }
});

// GET /tags
router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const tags = await prisma.userTag.findMany({
      where: { userIdSetter: userIdSetter },
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /tags
router.delete('/tags', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const { targetUserId, tagName } = req.body;

    await prisma.userTag.delete({
      where: {
        userIdSetter_userIdTarget_tagName: {
          userIdSetter: userIdSetter,
          userIdTarget: targetUserId,
          tagName: tagName,
        },
      },
    });
    res.sendStatus(204); // 204 = No Content (SUccessful deletion)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== API: Nicknames (Feature 1) ==========

// GET /nicknames
// (Optional Query: ?groupId=...)
router.get('/nicknames', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const { groupId } = req.query; // get 'groupId' from query param (ex. /nicknames?groupId=45)

    const whereCondition = {
      userIdSetter: userIdSetter,
      // if groupId is provided, add it to the condition
      ...(groupId && { groupId: parseInt(groupId) }),
    };

    const nicknames = await prisma.nickname.findMany({
      where: whereCondition,
    });

    res.json(nicknames);
  } catch (error) {
    console.error('Error fetching nicknames:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /nicknames
router.put('/nicknames', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const { groupId, targetUserId, nickname } = req.body;

    console.log('PUT /nicknames request:', {
      userIdSetter,
      groupId,
      targetUserId,
      nickname,
    });

    if (!(await isUserMember(userIdSetter, groupId))) {
      console.log('❌ Setter not a member:', userIdSetter, groupId);
      return res
        .status(403)
        .json({ error: 'You are not a member of this group.' });
    }

    if (!(await isUserMember(targetUserId, groupId))) {
      console.log('❌ Target not a member:', targetUserId, groupId);
      return res
        .status(400)
        .json({ error: 'Target user is not in this group.' });
    }

    if (userIdSetter === targetUserId) {
      return res
        .status(400)
        .json({ error: 'You cannot set a nickname for yourself.' });
    }

    console.log('✅ All checks passed, creating nickname...');

    // Create or update (Upsert)
    const newNickname = await prisma.nickname.upsert({
      where: {
        groupId_userIdSetter_userIdTarget: {
          groupId: groupId,
          userIdSetter: userIdSetter,
          userIdTarget: targetUserId,
        },
      },
      update: { nickname: nickname }, // If exists, update it
      create: {
        // If not exists, create a new one
        groupId: groupId,
        userIdSetter: userIdSetter,
        userIdTarget: targetUserId,
        nickname: nickname,
      },
    });
    res.json(newNickname);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /nicknames
router.delete('/nicknames', authenticateToken, async (req, res) => {
  try {
    const userIdSetter = req.user.userId;
    const { groupId, targetUserId } = req.body;

    if (!groupId || !targetUserId) {
      return res
        .status(400)
        .json({ error: 'groupId and targetUserId are required.' });
    }

    await prisma.nickname.delete({
      where: {
        groupId_userIdSetter_userIdTarget: {
          groupId: groupId,
          userIdSetter: userIdSetter,
          userIdTarget: targetUserId,
        },
      },
    });

    res.sendStatus(204); // 204 = No Content (Successful deletion)
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ error: 'Nickname not found or you do not own it.' });
    }
    console.error('Error deleting nickname:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== API: Forbidden Words (Feature 4) ==========

// POST /groups/:id/forbidden-words
router.post(
  '/groups/:id/forbidden-words',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.id);
      const { word } = req.body;

      if (!(await isUserMember(userId, groupId))) {
        return res
          .status(403)
          .json({ error: 'You are not a member of this group.' });
      }

      const newWord = await prisma.forbiddenWord.create({
        data: {
          word: word,
          groupId: groupId,
          addedByUserId: userId,
        },
      });

      // Broadcast to all members in the room
      const { getWsConnections } = require('../ws/handler');
      const { broadcastToRoom } = require('../ws/lib-rooms');
      broadcastToRoom(
        groupId,
        {
          type: 'forbidden_word_added',
          word: word,
        },
        getWsConnections()
      );

      res.status(201).json(newWord);
    } catch (error) {
      if (error.code === 'P2002')
        return res
          .status(400)
          .json({ error: 'Word already forbidden in this group.' });
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /groups/:id/forbidden-words
router.get(
  '/groups/:id/forbidden-words',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.id);

      if (!(await isUserMember(userId, groupId))) {
        return res
          .status(403)
          .json({ error: 'You are not a member of this group.' });
      }

      const words = await prisma.forbiddenWord.findMany({
        where: { groupId: groupId },
      });
      res.json(words);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /groups/:id/forbidden-words
router.delete(
  '/groups/:id/forbidden-words',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const groupId = parseInt(req.params.id);
      const { word } = req.body;

      if (!(await isUserMember(userId, groupId))) {
        return res
          .status(403)
          .json({ error: 'You are not a member of this group.' });
      }

      await prisma.forbiddenWord.delete({
        where: {
          word_groupId: {
            word: word,
            groupId: groupId,
          },
        },
      });

      // Broadcast to all members in the room
      const { getWsConnections } = require('../ws/handler');
      const { broadcastToRoom } = require('../ws/lib-rooms');
      broadcastToRoom(
        groupId,
        {
          type: 'forbidden_word_removed',
          word: word,
        },
        getWsConnections()
      );

      res.sendStatus(204); // Successful deletion
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
