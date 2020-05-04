const { dispatchChatCommand } = require('../../lib/chat');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  const topicMessage = events.topic('twitch.chat.message');

  const chatCommands = {
    fireworks: ({ args, channel, meta }) => {
      const [number = 1, spread = 30] = args;
      services.call(
        'twitch.chat.say',
        channel,
        `@${meta.userInfo.userName}, let there be light`
      );
      services.call('web.socket.broadcast', {
        type: 'fireworks',
        number,
        spread,
      });
    },
  };

  topicMessage.on(async (eventData) => {
    log.debug({ msg: 'gotchat', eventData });
    dispatchChatCommand(eventData, chatCommands)
  });
};
