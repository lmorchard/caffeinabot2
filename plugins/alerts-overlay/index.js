module.exports = async (context) => {
  const { config, events, log, services } = context;
  events.on('twitch.following', ({ userId, userDisplayName }) => {
    services.call('sam.say', {
      text: `Thank you for the follow, ${userDisplayName}!`,
    });
    services.call('web.socket.broadcast', {
      type: 'following',
      userId,
      userDisplayName,
    });
  });
};
