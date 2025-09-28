module.exports = {
    // Bot Identity
    SESSION_ID: process.env.SESSION_ID || 'nil-ultimate-session',
    BOT_NAME: '✨ 𝚴𝚯𝚻 𝐔𝚪 𝚴𝚰𝐋 🔥',
    OWNER_NUMBER: '923474810818',
    PREFIX: '.',
    
    // Bot Settings
    MAX_FILE_SIZE: 100,
    AUTO_READ_MESSAGES: true,
    WELCOME_NEW_MEMBERS: true,
    AUTO_RESPONSE: true,
    
    // APIs
    OPENAI_KEY: process.env.OPENAI_KEY || '',
    YOUTUBE_API: process.env.YOUTUBE_API || '',
    WEATHER_API: process.env.WEATHER_API || '',
    
    // Deployment
    PORT: process.env.PORT || 3000,
    DEPLOY_METHOD: process.env.DEPLOY_METHOD || 'terminal'
};
