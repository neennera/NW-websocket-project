const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticateToken } = require('../auth.middleware.js');

const router = express.Router();
const prisma = new PrismaClient();

// GET /groups
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const memberships = await prisma.groupMember.findMany({
            where: { userId: userId },
            include: {
                group: true,
            },
        });
        const groups = memberships.map(m => m.group);
        res.json(groups);
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
                    create: [
                        { userId: userId }
                    ]
                }
            }
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
        const { targetUserId } = req.body;

        if (selfUserId === targetUserId) {
            return res.status(400).json({ error: "Cannot create DM with yourself." });
        }

        const existingGroup = await prisma.group.findFirst({
            where: {
                isPrivateChat: true,
                AND: [
                    { members: { some: { userId: selfUserId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
            }
        });

        if (existingGroup) {
            return res.json(existingGroup);
        }

        const newDM = await prisma.group.create({
            data: {
                name: `DM_${selfUserId}_${targetUserId}`,
                isPrivateChat: true,
                members: {
                    create: [
                        { userId: selfUserId },
                        { userId: targetUserId }
                    ]
                }
            }
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
            return res.status(403).json({ error: "Cannot join a private chat." });
        }

        const newMembership = await prisma.groupMember.create({
            data: {
                userId: userId,
                groupId: groupId,
            }
        });

        res.status(201).json(newMembership); // 201 = Created

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'You are already a member of this group.' });
        }
        if (error.code === 'P2003') {
            return res.status(404).json({ error: 'Group not found.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// GET /groups/:id/messages
router.get('/:id/messages', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const groupId = parseInt(req.params.id);

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });
        if (!member) {
            return res.status(403).json({ error: "You are not a member of this group." });
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
            return res.status(400).json({ error: 'Message content cannot be empty.' });
        }

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
        });
        if (!member) {
            return res.status(403).json({ error: 'You are not a member of this group.' });
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
        res.status(500).json({ error: 'An error occurred while sending the message.' });
    }
});

module.exports = router;