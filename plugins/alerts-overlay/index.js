module.exports = async (context) => {
  const { config, events, log, services } = context;
  events.on('twitch.following', (details) => {
    services.call('web.socket.broadcast', {
      type: 'following',
      details,
    });
  });
};
 