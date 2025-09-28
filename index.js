const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 🚀 NIL BRANDING
const NIL_BRAND = `
╔═══════════════════════╗
║    🚀 𝚻𝚮𝚵 𝐁𝐎𝐓 𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆...     ║
║      ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥      ║
║  📞 Owner: 923474810818 ║
╚═══════════════════════╝
`;

console.log(NIL_BRAND);

class UltimateNILBot {
    constructor() {
        this.sock = null;
        this.commands = new Map();
        this.loadCommands();
    }

    async connectToWhatsApp() {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();
        
        this.sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥', 'Safari', '3.0.0'],
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false
        });

        this.setupEventHandlers(saveCreds);
        return this.sock;
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(`\n${NIL_BRAND}`);
                console.log('📱 Scan QR Code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('🔄 Connection closed. Reconnecting...');
                if (shouldReconnect) this.connectToWhatsApp();
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

        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('messages.upsert', this.handleIncomingMessage.bind(this));
        this.sock.ev.on('group-participants.update', this.handleGroupUpdate.bind(this));
    }

    loadCommands() {
        const commandsDir = path.join(__dirname, 'plugins');
        if (fs.existsSync(commandsDir)) {
            fs.readdirSync(commandsDir).forEach(file => {
                if (file.endsWith('.js')) {
                    try {
                        const command = require(path.join(commandsDir, file));
                        if (command.name) {
                            this.commands.set(command.name, command);
                        }
                    } catch (error) {
                        console.error(`Error loading command ${file}:`, error);
                    }
                }
            });
        }
        console.log(`✅ Loaded ${this.commands.size} commands`);
    }

    async handleIncomingMessage({ messages }) {
        const message = messages[0];
        if (!message.message || message.key.fromMe) return;

        try {
            const body = this.extractMessageBody(message);
            const sender = message.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');
            const pushname = message.pushName || 'User';

            if (body && body.startsWith(config.prefix)) {
                await this.processCommand(body, sender, message, pushname, isGroup);
            } else {
                await this.handleNonCommand(message, body, sender, isGroup);
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    }

    extractMessageBody(message) {
        const msg = message.message;
        return msg.conversation || 
               msg.extendedTextMessage?.text || 
               msg.imageMessage?.caption || 
               msg.videoMessage?.caption || '';
    }

    async processCommand(body, sender, message, pushname, isGroup) {
        const [command, ...args] = body.slice(config.prefix.length).trim().split(' ');
        const cmd = command.toLowerCase();
        
        console.log(`Command: ${cmd} from ${pushname} in ${isGroup ? 'group' : 'DM'}`);

        // Handle specific commands
        switch(cmd) {
            case 'menu':
                await this.showMenu(sender);
                break;
            case 'ping':
                await this.pingCommand(sender);
                break;
            case 'owner':
                await this.ownerInfo(sender);
                break;
            case 'tagall':
                if (isGroup) await this.tagAll(sender);
                break;
            default:
                if (this.commands.has(cmd)) {
                    await this.commands.get(cmd).execute(this.sock, message, args);
                } else {
                    await this.sock.sendMessage(sender, { 
                        text: `❌ Unknown command: ${cmd}\nUse ${config.prefix}menu for command list` 
                    });
                }
        }
    }

    async showMenu(jid) {
        const menu = this.generateMenu();
        await this.sock.sendMessage(jid, { text: menu });
    }

    generateMenu() {
        return `
╔═══════════════════════╗
║    ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥     ║
║   📞 923474810818     ║
╚═══════════════════════╝

📋 *𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒*:

🎯 *𝐂𝐎𝐑𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
• ${config.prefix}menu - Show all commands
• ${config.prefix}ping - Bot speed test
• ${config.prefix}owner - Contact owner
• ${config.prefix}info - Bot information
• ${config.prefix}status - Bot status

🎵 *𝐌𝐔𝐒𝐈𝐂 & 𝐌𝐄𝐃𝐈𝐀*
• ${config.prefix}play [song] - Play music
• ${config.prefix}yt [query] - YouTube search
• ${config.prefix}ytmp4 [url] - Download YouTube video
• ${config.prefix}ytmp3 [url] - Download YouTube audio
• ${config.prefix}spotify [song] - Spotify download
• ${config.prefix}song [name] - Song download

📥 *𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑𝐒*
• ${config.prefix}instagram [url] - Instagram download
• ${config.prefix}tiktok [url] - TikTok download
• ${config.prefix}facebook [url] - Facebook download
• ${config.prefix}twitter [url] - Twitter download

🖼️ *𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒 & 𝐈𝐌𝐀𝐆𝐄𝐒*
• ${config.prefix}sticker - Create sticker
• ${config.prefix}toimg - Sticker to image
• ${config.prefix}attp [text] - Animated text
• ${config.prefix}emix [emoji] - Emoji mixer

🔍 *𝐒𝐄𝐀𝐑𝐂𝐇 & 𝐓𝐎𝐎𝐋𝐒*
• ${config.prefix}google [query] - Google search
• ${config.prefix}image [query] - Image search
• ${config.prefix}weather [city] - Weather info
• ${config.prefix}covid [country] - COVID stats
• ${config.prefix}news - Latest news

👥 *𝐆𝐑𝐎𝐔𝐏 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓*
• ${config.prefix}groupinfo - Group information
• ${config.prefix}tagall - Mention all members
• ${config.prefix}kick @user - Remove user
• ${config.prefix}promote @user - Make admin
• ${config.prefix}demote @user - Remove admin
• ${config.prefix}mute - Mute group
• ${config.prefix}unmute - Unmute group
• ${config.prefix}group open/close - Group settings

🎮 *𝐅𝐔𝐍 & 𝐆𝐀𝐌𝐄𝐒*
• ${config.prefix}quote - Random quote
• ${config.prefix}joke - Get a joke
• ${config.prefix}memes - Random meme
• ${config.prefix}truth - Truth game
• ${config.prefix}dare - Dare game
• ${config.prefix}couple - Random couple

⚡ *𝐀𝐍𝐈𝐌𝐄 & 𝐄𝐍𝐓𝐄𝐑𝐓𝐀𝐈𝐍𝐌𝐄𝐍𝐓*
• ${config.prefix}anime [name] - Anime search
• ${config.prefix}character [name] - Anime character
• ${config.prefix}waifu - Random waifu
• ${config.prefix}husbando - Random husbando

🔞 *𝐍𝐒𝐅𝐖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* (Owner Only)
• ${config.prefix}nsfwwaifu - NSFW waifu
• ${config.prefix}hentai - Hentai images
• ${config.prefix}blowjob - NSFW content
• ${config.prefix}thighs - NSFW content

🛠️ *𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*
• ${config.prefix}bc [text] - Broadcast message
• ${config.prefix}ban @user - Ban user
• ${config.prefix}unban @user - Unban user
• ${config.prefix}join [link] - Join group
• ${config.prefix}leave - Leave group

⚡ *𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐍𝐈𝐋* 🚀
_Total 1200+ Commands Available_

💡 Use ${config.prefix}help [command] for more info
        `.trim();
    }

    async pingCommand(jid) {
        const start = Date.now();
        const pingMsg = await this.sock.sendMessage(jid, { text: '🏓 *Pinging...*' });
        const latency = Date.now() - start;
        
        await this.sock.sendMessage(jid, { 
            text: `╔══════════════════╗
║     🏓 𝐏𝐎𝐍𝐆!      ║
╠══════════════════╣
║ ⚡ 𝐋𝐚𝐭𝐞𝐧𝐜𝐲: ${latency}ms
║ 👑 𝐎𝐰𝐧𝐞𝐫: 923474810818
║ 🤖 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
╚══════════════════╝`
        });
        
        if (pingMsg.key) await this.sock.sendMessage(jid, { delete: pingMsg.key });
    }

    async ownerInfo(jid) {
        await this.sock.sendMessage(jid, { 
            text: `╔══════════════════╗
║    👑 𝐎𝐖𝐍𝐄𝐑     ║
╠══════════════════╣
║ 📞 𝐍𝐮𝐦𝐛𝐞𝐫: 923474810818
║ 🤖 𝐁𝐨𝐭: ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
║ ⚡ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 3.0.0
║ 🚀 𝐏𝐨𝐰𝐞𝐫: Ultimate
╚══════════════════╝

📩 Contact for queries/bot setup!`
        });
    }

    async tagAll(jid) {
        try {
            const groupMetadata = await this.sock.groupMetadata(jid);
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
            
            await this.sock.sendMessage(jid, { 
                text: tagMessage,
                mentions: mentions
            });
        } catch (error) {
            await this.sock.sendMessage(jid, { text: '❌ Failed to tag members' });
        }
    }

    async handleGroupUpdate({ id, participants, action }) {
        if (action === 'add') {
            await this.sendWelcomeMessage(id, participants);
        }
    }

    async sendWelcomeMessage(groupJid, newParticipants) {
        const welcomeMsg = `╔══════════════════╗
║    🎉 𝐖𝐄𝐋𝐂𝐎𝐌𝐄!   ║
╠══════════════════╣
║ ✨ Welcome to the group!
║ 🤖 I'm ✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥
║ 📞 Owner: 923474810818
║ ⚡ Use ${config.prefix}menu
║ 🚀 for all commands!
╚══════════════════╝`;

        for (const participant of newParticipants) {
            await this.sock.sendMessage(groupJid, { 
                text: welcomeMsg,
                mentions: [participant]
            });
        }
    }

    async handleNonCommand(message, body, sender, isGroup) {
        // Auto-response or AI features can be added here
        if (body && body.toLowerCase().includes('nil')) {
            await this.sock.sendMessage(sender, { 
                text: `✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥 is here! Use ${config.prefix}menu to see my powers! 🚀` 
            });
        }
    }
}

// Start the Ultimate Bot
const bot = new UltimateNILBot();
bot.connectToWhatsApp().catch(console.error);

module.exports = bot;
