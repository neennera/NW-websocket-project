const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const saltRounds = 10;

async function main() {
    console.log('Start seeding...');

    const plainPassword = 'pass123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    console.log(`Hashed password '${plainPassword}' to: ${hashedPassword}`);

    await prisma.user.createMany({
        data: [
            {
                email: 'alice@example.com',
                username: 'alice',
                passwordHash: hashedPassword,
                avatarId: 1,
            },
            {
                email: 'bob@example.com',
                username: 'bob',
                passwordHash: hashedPassword,
                avatarId: 6,
            },
        ],
        skipDuplicates: true,
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });