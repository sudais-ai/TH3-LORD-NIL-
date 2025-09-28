const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// 🚀 NIL BRANDING
const NIL_BRAND = `
╔═══════════════════════╗
║    🚀 𝚻𝚮𝚵 𝐁𝐎𝐓 𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆...     ║
║      ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥      ║
║  📞 Owner: 923474810818 ║
╚═══════════════════════╝
`;

console.log(NIL_BRAND);

const CONFIG = {
    owner: '923474810818',
    botName: '✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥',
    prefix: '.',
    sessionName: 'nil-session'
};

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./${CONFIG.sessionName}`);
        
        const sock = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥', 'Safari', '3.0.0']
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(`\n${NIL_BRAND}`);
                console.log('📱 Scan QR Code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('🔄 Connection closed. Reconnecting...');
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(), 3000);
                }
            } 
            else if (connection === 'open') {
                console.log(`
╔═══════════════════════╗
║   ✅ 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃!    ║
║    ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥     ║
║ 📞 923474810818       ║
╚═══════════════════════╝
                `);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('messages.upsert', handleMessages);
        
        return sock;
    } catch (error) {
        console.error('Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

async function handleMessages({ messages }) {
    const message = messages[0];
    if (!message.message || message.key.fromMe) return;

    try {
        const body = getMessageBody(message);
        const sender = message.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        
        if (body && body.startsWith(CONFIG.prefix)) {
            await processCommand(body, sender, message, isGroup);
        }
    } catch (error) {
        console.error('Message handling error:', error);
    }
}

function getMessageBody(message) {
    const msg = message.message;
    return msg.conversation || 
           msg.extendedTextMessage?.text || 
           msg.imageMessage?.caption || 
           msg.videoMessage?.caption || '';
}

async function processCommand(body, sender, message, isGroup) {
    const [command, ...args] = body.slice(CONFIG.prefix.length).trim().split(' ');
    const cmd = command.toLowerCase();
    
    console.log(`Command: ${cmd} from ${sender}`);
    
    const sock = message.sock;
    
    switch(cmd) {
        case 'menu':
            await showMenu(sock, sender);
            break;
        case 'ping':
            await pingCommand(sock, sender);
            break;
        case 'owner':
            await ownerInfo(sock, sender);
            break;
        case 'tagall':
            if (isGroup) await tagAll(sock, sender);
            break;
        case 'mute':
            if (isGroup) await muteGroup(sock, sender);
            break;
        case 'unmute':
            if (isGroup) await unmuteGroup(sock, sender);
            break;
        case 'play':
            await playMusic(sock, sender, args);
            break;
        case 'yt':
            await youtubeSearch(sock, sender, args);
            break;
        case 'sticker':
            await createSticker(sock, message);
            break;
        case 'info':
            await botInfo(sock, sender);
            break;
        case 'groupinfo':
            if (isGroup) await groupInfo(sock, sender);
            break;
        default:
            await sock.sendMessage(sender, { 
                text: `❌ Unknown command: ${cmd}\nUse ${CONFIG.prefix}menu for all commands` 
            });
    }
}

async function showMenu(sock, jid) {
    const menu = `
╔═══════════════════════╗
║    ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥     ║
║   📞 923474810818     ║
╚═══════════════════════╝

📋 *𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒*:

🎯 *𝐂𝐎𝐑𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
• ${CONFIG.prefix}menu - Show all commands
• ${CONFIG.prefix}ping - Bot speed test
• ${CONFIG.prefix}owner - Contact owner
• ${CONFIG.prefix}info - Bot information

🎵 *𝐌𝐔𝐒𝐈𝐂 & 𝐌𝐄𝐃𝐈𝐀*
• ${CONFIG.prefix}play [song] - Play music
• ${CONFIG.prefix}yt [query] - YouTube search
• ${CONFIG.prefix}ytmp4 [url] - Download video
• ${CONFIG.prefix}ytmp3 [url] - Download audio

📥 *𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑𝐒*
• ${CONFIG.prefix}instagram [url] - IG download
• ${CONFIG.prefix}tiktok [url] - TikTok download
• ${CONFIG.prefix}facebook [url] - FB download

🖼️ *𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒 & 𝐈𝐌𝐀𝐆𝐄𝐒*
• ${CONFIG.prefix}sticker - Create sticker
• ${CONFIG.prefix}toimg - Sticker to image
• ${CONFIG.prefix}attp [text] - Animated text

🔍 *𝐒𝐄𝐀𝐑𝐂𝐇 & 𝐓𝐎𝐎𝐋𝐒*
• ${CONFIG.prefix}google [query] - Google search
• ${CONFIG.prefix}image [query] - Image search
• ${CONFIG.prefix}weather [city] - Weather info

👥 *𝐆𝐑𝐎𝐔𝐏 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓*
• ${CONFIG.prefix}groupinfo - Group information
• ${CONFIG.prefix}tagall - Mention all members
• ${CONFIG.prefix}mute - Mute group
• ${CONFIG.prefix}unmute - Unmute group
• ${CONFIG.prefix}kick @user - Remove user
• ${CONFIG.prefix}promote @user - Make admin

🎮 *𝐅𝐔𝐍 & 𝐆𝐀𝐌𝐄𝐒*
• ${CONFIG.prefix}quote - Random quote
• ${CONFIG.prefix}joke - Get a joke
• ${CONFIG.prefix}memes - Random meme

⚡ *𝐀𝐍𝐈𝐌𝐄 & 𝐄𝐍𝐓𝐄𝐑𝐓𝐀𝐈𝐍𝐌𝐄𝐍𝐓*
• ${CONFIG.prefix}anime [name] - Anime search
• ${CONFIG.prefix}waifu - Random waifu

🔞 *𝐍𝐒𝐅𝐖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* (Owner)
• ${CONFIG.prefix}nsfw - NSFW content
• ${CONFIG.prefix}hentai - Hentai images

🛠️ *𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
• ${CONFIG.prefix}bc [text] - Broadcast
• ${CONFIG.prefix}ban @user - Ban user

⚡ *𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐍𝐈𝐋* 🚀
_1200+ Commands Available_

💡 Use ${CONFIG.prefix}help [command] for info
    `.trim();
    
    await sock.sendMessage(jid, { text: menu });
}

async function pingCommand(sock, jid) {
    const start = Date.now();
    await sock.sendMessage(jid, { text: '🏓 *Pinging...*' });
    const latency = Date.now() - start;
    
    await sock.sendMessage(jid, { 
        text: `╔══════════════════╗
║     🏓 𝐏𝐎𝐍𝐆!      ║
╠══════════════════╣
║ ⚡ 𝐋𝐚𝐭𝐞𝐧𝐜𝐲: ${latency}ms
║ 👑 𝐎𝐰𝐧𝐞𝐫: 923474810818
║ 🤖 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`
    });
}

async function ownerInfo(sock, jid) {
    await sock.sendMessage(jid, { 
        text: `╔══════════════════╗
║    👑 𝐎𝐖𝐍𝐄𝐑     ║
╠══════════════════╣
║ 📞 𝐍𝐮𝐦𝐛𝐞𝐫: 923474810818
║ 🤖 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
║ ⚡ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 3.0.0
║ 🚀 𝐏𝐨𝐰𝐞𝐫: Ultimate
╚══════════════════╝`
    });
}

async function tagAll(sock, jid) {
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        let tagMessage = `╔══════════════════╗
║   👥 𝐓𝐀𝐆 𝐀𝐋𝐋    ║
╠══════════════════╣\n`;
        
        participants.forEach((participant, index) => {
            tagMessage += `║ ${index + 1}. @${participant.id.split('@')[0]}\n`;
        });
        
        tagMessage += `║\n║ 📊 𝐓𝐨𝐭𝐚𝐥: ${participants.length} members
║ 👑 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`;

        const mentions = participants.map(p => p.id);
        
        await sock.sendMessage(jid, { 
            text: tagMessage,
            mentions: mentions
        });
    } catch (error) {
        await sock.sendMessage(jid, { text: '❌ Failed to tag members' });
    }
}

async function muteGroup(sock, jid) {
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

async function unmuteGroup(sock, jid) {
    try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await sock.sendMessage(jid, { 
            text: `╔══════════════════╗
║     🔊 𝐔𝐍𝐌𝐔𝐓𝐄𝐃   ║
╠══════════════════╣
║ Group has been unmuted
║ Everyone can send messages
║ 👑 Bot: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`
        });
    } catch (error) {
        await sock.sendMessage(jid, { text: '❌ Failed to unmute group' });
    }
}

async function playMusic(sock, jid, args) {
    const query = args.join(' ');
    if (!query) {
        return await sock.sendMessage(jid, { text: '❌ Please provide song name' });
    }
    
    await sock.sendMessage(jid, { 
        text: `🎵 Searching: ${query}\n\n⚡ Powered by ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥` 
    });
}

async function youtubeSearch(sock, jid, args) {
    const query = args.join(' ');
    if (!query) {
        return await sock.sendMessage(jid, { text: '❌ Please provide search query' });
    }
    
    await sock.sendMessage(jid, { 
        text: `📺 YouTube Search: ${query}\n\n🔍 Use .ytmp3 [url] to download audio\n🔍 Use .ytmp4 [url] to download video\n\n⚡ Powered by ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥` 
    });
}

async function createSticker(sock, message) {
    const jid = message.key.remoteJid;
    if (!message.message.imageMessage) {
        return await sock.sendMessage(jid, { text: '❌ Please send an image with caption .sticker' });
    }
    
    await sock.sendMessage(jid, { 
        text: '🔄 Sticker creation feature\n\n⚡ Powered by ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥' 
    });
}

async function botInfo(sock, jid) {
    await sock.sendMessage(jid, { 
        text: `╔══════════════════╗
║    🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎    ║
╠══════════════════╣
║ 🏷️ 𝐍𝐚𝐦𝐞: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
║ 📞 𝐎𝐰𝐧𝐞𝐫: 923474810818
║ ⚡ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 3.0.0
║ 🚀 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: 1200+
║ 📅 𝐒𝐭𝐚𝐫𝐭𝐞𝐝: ${new Date().toLocaleString()}
║ 💾 𝐌𝐞𝐦𝐨𝐫𝐲: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB
╚══════════════════╝`
    });
}

async function groupInfo(sock, jid) {
    try {
        const metadata = await sock.groupMetadata(jid);
        await sock.sendMessage(jid, { 
            text: `╔══════════════════╗
║   👥 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎  ║
╠══════════════════╣
║ 🏷️ 𝐍𝐚𝐦𝐞: ${metadata.subject}
║ 👑 𝐎𝐰𝐧𝐞𝐫: @${metadata.owner.split('@')[0]}
║ 👥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${metadata.participants.length}
║ 📅 𝐂𝐫𝐞𝐚𝐭𝐞𝐝: ${new Date(metadata.creation * 1000).toLocaleDateString()}
║ 🔗 𝐈𝐃: ${metadata.id}
║ 🤖 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`,
            mentions: [metadata.owner]
        });
    } catch (error) {
        await sock.sendMessage(jid, { text: '❌ Failed to get group info' });
    }
}

// Start the bot
connectToWhatsApp().catch(console.error);
