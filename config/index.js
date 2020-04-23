require('dotenv').config();

const convict = require('convict');

const config = convict({
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
    sessionSecret : {
      doc: 'secret for web frontend sessions',
      format: String,
      default: 'change this secret',
      env: 'SESSION_SECRET',
    }
  },  
  log: {
    
  }
});

module.exports = config.getProperties();