module.exports = async (context) => {
  const { config, log, events, services } = context;

  events.onMatch('.*', (name, ...args) => {
    log.trace({ msg: "TOPIC", topic: name });
  });
};
