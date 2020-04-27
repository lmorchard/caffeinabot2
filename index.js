const config = require('./lib/config');
const { createNanoEvents } = require('nanoevents');
const { createServiceHub } = require('./lib/services');
const { initPluginModules } = require('./lib/plugins');
const log = require('pino')(config.log);

async function init() {
  await initPluginModules(
    {
      log,
      config,
      events: createNanoEvents(),
      services: createServiceHub(),
    },
    [
      'core/web-server',
      'core/twitch-auth',
      'core/twitch-chatbot',
      'core/twitch-pubsub',
      // 'core/twitch-webhooks',
      'core/obs-websocket',
      'plugins/edison-carter-overlay',
      'plugins/stream-loader',
      'plugins/youtube-playlist-shuffle',
      'plugins/fireworks',
    ]
  );
}

init().catch((err) => log.error(err));
