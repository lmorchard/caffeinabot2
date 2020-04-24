const tmi = require('tmi.js');

module.exports = async (context) => {
  const { config, events, log, services } = context;
  const { channels, username, password } = config.twitch.chat;

  const logger = {
    setLevel: () => {},
    ...['trace', 'debug', 'info', 'warn', 'error', 'fatal'].reduce(
      (acc, level) => ({ ...acc, [level]: (msg) => log[level]({ msg }) }),
      {}
    ),
  };

  const client = new tmi.Client({
    logger,
    options: { debug: true },
    connection: {
      reconnect: true,
      secure: true,
    },
    identity: {
      username,
      password,
    },
    channels: channels.split(','),
  });

  services.provide('twitch:chat:say', (channel, message) =>
    client.say(channel, message)
  );

  client.on('message', (channel, tags, message, self) => {
    events.emit('twitch:chat:message', {
      channel,
      tags,
      message,
      self,
    });
  });

  client.connect();
};
