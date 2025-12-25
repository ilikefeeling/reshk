const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'custom.env') });
const prisma = new PrismaClient();

async function test() {
    const email = 'ilikepeople@icloud.com';
    const password = 'admin123!';

    console.log(`Checking user: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User found. Hash:', user.passwordHash);
    console.log('User Role:', user.role);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match for "${password}": ${isMatch}`);

    process.exit(0);
}

test().catch(e => {
    console.error(e);
    process.exit(1);
});
