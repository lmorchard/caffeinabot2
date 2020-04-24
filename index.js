const config = require('./lib/config');
const { createNanoEvents } = require('nanoevents');
const { createServiceHub } = require('./lib/services');
const { initPluginModules } = require('./lib/plugins');
const log = require('pino')(config.log);

const modules = [
  'core/web-server',
  'core/twitch-chatbot',
  'core/obs-remote',
  'plugins/twitch-auth',
  'plugins/edison-carter-overlay',
  'plugins/stream-loader',
  'plugins/youtube-playlist-shuffle',
  'plugins/fireworks',
];

async function init() {
  await initPluginModules(
    {
      log,
      config,
      events: createNanoEvents(),
      services: createServiceHub(),
    },
    modules
  );
}

init().catch((err) => log.error(err));
