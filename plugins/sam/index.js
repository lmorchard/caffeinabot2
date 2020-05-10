const { dispatchChatCommand } = require('../../lib/chat');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  services.provide('sam.say', ({ text, phonetic }) => {
    log.trace({ msg: 'samSay', text, phonetic });
    services.call('web.socket.broadcast', {
      type: 'samSay',
      text,
      phonetic,
    });
  });

  const topicMessage = events.topic('twitch.chat.message');

  const chatCommands = {
    samsay: ({ args, channel, meta }) => {
      if (meta.userInfo.userName !== 'lmorchard') {
        // TODO: could use some real access control here
        return;
      }
      services.call('sam.say', { text: args.join(' ') });
    },
  };

  topicMessage.on(async (eventData) => {
    dispatchChatCommand(eventData, chatCommands);
  });
};
