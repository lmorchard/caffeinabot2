require('dotenv').config();

const convict = require('convict');

const config = convict({
  log: {
    level: {
      doc: 'pino log level',
      format: String,
      env: 'LOG_LEVEL',
      default: 'info',
    }
  },
  web: {
    host: {
      doc: 'web server host',
      format: 'ipaddress',
      default: '0.0.0.0',
      env: 'HOST',
    },
    port: {
      doc: 'web server port',
      format: 'port',
      default: 9990,
      env: 'PORT',
    },
    sessionSecret: {
      doc: 'secret for web frontend sessions',
      format: String,
      default: 'change this secret',
      env: 'SESSION_SECRET',
    },
  },
  twitch: {
    api: {
      clientId: {
        doc: 'twitch oauth client ID',
        format: String,
        env: 'TWITCH_CLIENT_ID',
        default: '',
      },
      clientSecret: {
        doc: 'twitch oauth client secret',
        format: String,
        env: 'TWITCH_CLIENT_SECRET',
        default: '',
      },
      refreshToken: {
        doc: 'twitch oauth refresh token',
        format: String,
        env: 'TWITCH_REFRESH_TOKEN',
        default: '',
      },
      accessToken: {
        doc: 'twitch oauth access token',
        format: String,
        env: 'TWITCH_ACCESS_TOKEN',
        default: '',
      }
    },
    chat: {
      username: {
        doc: 'twitch chat username',
        format: String,
        env: 'TWITCH_CHAT_USERNAME',
        default: '',
      },
      password: {
        doc: 'twitch chat password',
        format: String,
        env: 'TWITCH_CHAT_PASSWORD',
        default: '',
      },
      channels: {
        doc: 'twitch chat channels',
        format: String,
        env: 'TWITCH_CHAT_CHANNELS',
        default: '',
      },
    },
  },
});

module.exports = config.getProperties();
