const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const NIL_CONFIG = {
    ownerNumber: 'YOUR_NUMBER_HERE', // Replace with your number
    botName: '🄽🄸🄻',
    prefix: '.',
    sessionName: 'nil-session'
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(`./${NIL_CONFIG.sessionName}`);
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['NIL-BOT', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(`\n🄽🄸🄻 🅆🄷🄰🅃🅂🄰🄿🄿 🄱🄾🅃`);
            console.log(`📱 Scan QR Code with WhatsApp`);
            console.log(`👑 Owner: ${NIL_CONFIG.ownerNumber}`);
            console.log(`🤖 Bot Name: ${NIL_CONFIG.botName}\n`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log(`\n✅ ${NIL_CONFIG.botName} Connected Successfully!`);
            console.log(`👑 Powered by: NIL`);
            console.log(`📞 Owner: ${NIL_CONFIG.ownerNumber}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Message handling
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && m.type === 'notify') {
            await handleMessage(sock, message);
        }
    });

    return sock;
}

async function handleMessage(sock, message) {
    try {
        const body = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.message?.imageMessage?.caption || '';
        
        const sender = message.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const command = body.trim().toLowerCase();
        
        // Basic commands
        if (command === NIL_CONFIG.prefix + 'menu') {
            await sock.sendMessage(sender, { 
                text: `*🄽🄸🄻 🅆🄷🄰🅃🅂🄰🄿🄿 🄱🄾🅃*

👑 *Owner*: ${NIL_CONFIG.ownerNumber}
🤖 *Bot Name*: ${NIL_CONFIG.botName}
⚡ *Prefix*: ${NIL_CONFIG.prefix}

📋 *Available Commands*:

🛠️ *Utilities*
• ${NIL_CONFIG.prefix}menu - Show this menu
• ${NIL_CONFIG.prefix}ping - Check bot speed
• ${NIL_CONFIG.prefix}owner - Contact owner

🎵 *Media*
• ${NIL_CONFIG.prefix}yt [query] - YouTube search
• ${NIL_CONFIG.prefix}play [song] - Play music

🔍 *Search*
• ${NIL_CONFIG.prefix}google [query] - Google search
• ${NIL_CONFIG.prefix}news - Latest news

📁 *Group*
• ${NIL_CONFIG.prefix}groupinfo - Group information
• ${NIL_CONFIG.prefix}tagall - Mention all members

✨ *Fun*
• ${NIL_CONFIG.prefix}sticker - Create sticker
• ${NIL_CONFIG.prefix}quote - Random quote

_More features coming soon..._

⚡ *Powered by NIL* 🚀`
            });
        }
        
        if (command === NIL_CONFIG.prefix + 'ping') {
            const start = Date.now();
            await sock.sendMessage(sender, { text: '🏓 Pinging...' });
            const latency = Date.now() - start;
            await sock.sendMessage(sender, { 
                text: `*🏓 PONG!*\n⚡ Latency: ${latency}ms\n👑 Owner: ${NIL_CONFIG.ownerNumber}`
            });
        }
        
        if (command === NIL_CONFIG.prefix + 'owner') {
            await sock.sendMessage(sender, { 
                text: `*👑 BOT OWNER*\n📞 Number: ${NIL_CONFIG.ownerNumber}\n🤖 Developed by: NIL\n\nContact for any issues or queries! 🚀`
            });
        }
        
        // Welcome message for new group members
        if (message.message?.protocolMessage?.type === 0 && isGroup) {
            const participant = message.message.protocolMessage.key.participant;
            await sock.sendMessage(sender, {
                text: `✨ Welcome to the group!\n\n👋 Hello! I'm ${NIL_CONFIG.botName}\n📞 Owner: ${NIL_CONFIG.ownerNumber}\n\nType ${NIL_CONFIG.prefix}menu to see all commands! 🚀`
            });
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Start the bot
connectToWhatsApp().catch(console.error);
