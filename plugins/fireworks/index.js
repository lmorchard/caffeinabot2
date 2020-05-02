const { dispatchChatCommand } = require('../../lib/chat');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  const chatCommands = {
    fireworks: ({ args, channel, tags }) => {
      const [number = 1, spread = 30] = args;
      services.call(
        'twitch:chat:say',
        channel,
        `@${tags.username}, let there be light`
      );
      services.call('web:socket:broadcast', {
        type: 'fireworks',
        number,
        spread,
      });
    },
  };

  events.on('twitch:chat:message', async (eventData) =>
    dispatchChatCommand(eventData, chatCommands)
  );
};
