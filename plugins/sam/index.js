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
};
