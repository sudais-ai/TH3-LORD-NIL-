const { exec } = require('child_process');
const fs = require('fs');

console.log(`
╔═══════════════════════╗
║  🚀 𝐃𝐄𝐏𝐋𝐎𝐘𝐌𝐄𝐍𝐓       ║
║ ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥     ║
╚═══════════════════════╝
`);

// Check Node version
exec('node --version', (err, stdout) => {
    console.log(`📦 Node.js Version: ${stdout}`);
});

// Install dependencies
console.log('📥 Installing dependencies...');
exec('npm install', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ Installation failed:', err);
        return;
    }
    console.log('✅ Dependencies installed successfully!');
    
    // Start bot
    console.log('🚀 Starting NIL Bot...');
    exec('npm start', (err, stdout, stderr) => {
        if (err) {
            console.error('❌ Bot failed to start:', err);
        }
    });
});
