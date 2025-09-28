console.log(`
╔═══════════════════════╗
║  🚀 𝐃𝐄𝐏𝐋𝐎𝐘𝐌𝐄𝐍𝐓       ║
║ ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥     ║
║ 📞 923474810818       ║
╚═══════════════════════╝
`);

const { exec } = require('child_process');

console.log('📦 Checking Node.js version...');
exec('node --version', (err, stdout) => {
    console.log(`✅ Node.js: ${stdout}`);
});

console.log('🚀 Starting NIL Bot...');
exec('npm start', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ Error:', err);
    }
});
