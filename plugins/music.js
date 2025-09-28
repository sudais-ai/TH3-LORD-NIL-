const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'play',
    description: 'Play YouTube music',
    
    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const query = args.join(' ');
        
        if (!query) {
            return await sock.sendMessage(jid, { 
                text: '❌ Please provide song name\nExample: .play shape of you' 
            });
        }

        try {
            await sock.sendMessage(jid, { text: '🎵 Searching for your song...' });
            
            const search = await yts(query);
            if (!search.videos.length) {
                return await sock.sendMessage(jid, { text: '❌ Song not found!' });
            }

            const video = search.videos[0];
            await sock.sendMessage(jid, { 
                text: `╔══════════════════╗
║     🎵 𝐒𝐎𝐍𝐆      ║
╠══════════════════╣
║ 📀 𝐓𝐢𝐭𝐥𝐞: ${video.title}
║ ⏰ 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${video.timestamp}
║ 👁️ 𝐕𝐢𝐞𝐰𝐬: ${video.views}
║ 🎬 𝐂𝐡𝐚𝐧𝐧𝐞𝐥: ${video.author.name}
║ 🔗 𝐔𝐑𝐋: ${video.url}
║\n║ 📥 Downloading audio...
╚══════════════════╝`
            });

            // Audio download logic would go here
            // This is simplified for example
            
            await sock.sendMessage(jid, { 
                text: `✅ Song found!\nUse: .ytmp3 ${video.url} to download audio` 
            });

        } catch (error) {
            await sock.sendMessage(jid, { text: '❌ Error playing song' });
        }
    }
};
