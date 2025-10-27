const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const saltRounds = 10;

async function main() {
  console.log('Start seeding...');

  const plainPassword = 'pass123';
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  console.log(`Hashed password '${plainPassword}' to: ${hashedPassword}`);

  // Create or get users
  const userA = await prisma.user.upsert({
    where: { username: 'A' },
    update: {},
    create: {
      email: 'userA@example.com',
      username: 'A',
      passwordHash: hashedPassword,
      avatarId: 1,
    },
  });

  const userB = await prisma.user.upsert({
    where: { username: 'B' },
    update: {},
    create: {
      email: 'userB@example.com',
      username: 'B',
      passwordHash: hashedPassword,
      avatarId: 2,
    },
  });

  // Create or get group
  const group = await prisma.group.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'ABgroup',
      isPrivateChat: false,
    },
  });

  // Add users to group
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: userA.id,
        groupId: group.id,
      },
    },
    update: {},
    create: {
      userId: userA.id,
      groupId: group.id,
    },
  });

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: userB.id,
        groupId: group.id,
      },
    },
    update: {},
    create: {
      userId: userB.id,
      groupId: group.id,
    },
  });

  // Create or get dm-room group for 1:1 chat
  const dmRoom = await prisma.group.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'dm-room',
      isPrivateChat: true,
    },
  });

  // Add users to dm-room
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: userA.id,
        groupId: dmRoom.id,
      },
    },
    update: {},
    create: {
      userId: userA.id,
      groupId: dmRoom.id,
    },
  });

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: userB.id,
        groupId: dmRoom.id,
      },
    },
    update: {},
    create: {
      userId: userB.id,
      groupId: dmRoom.id,
    },
  });

  console.log('Seeding finished.');
  console.log('Created users:', userA.username, userB.username);
  console.log('Created groups:', group.name, 'and', dmRoom.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
