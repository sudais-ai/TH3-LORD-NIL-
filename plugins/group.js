module.exports = {
    name: 'mute',
    description: 'Mute group',
    
    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '❌ This command only works in groups' });
        }

        try {
            await sock.groupSettingUpdate(jid, 'announcement');
            await sock.sendMessage(jid, { 
                text: `╔══════════════════╗
║     🔇 𝐌𝐔𝐓𝐄𝐃     ║
╠══════════════════╣
║ Group has been muted
║ Only admins can send messages
║ 👑 Bot: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`
            });
        } catch (error) {
            await sock.sendMessage(jid, { text: '❌ Failed to mute group' });
        }
    }
};
