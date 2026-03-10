const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    console.log('Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'pipe', cwd: __dirname });
    console.log('Success!');
} catch (error) {
    console.log('Failed!');
    const output = (error.stdout ? error.stdout.toString() : '') + '\n' + (error.stderr ? error.stderr.toString() : '');
    fs.writeFileSync(path.join(__dirname, 'error.log'), output);
}
