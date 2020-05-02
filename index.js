const config = require('./lib/config');
const log = require('pino')(config.log);
const { createNanoEvents } = require('./lib/events');
const { createServiceHub } = require('./lib/services');
const { initPluginModules } = require('./lib/plugins');

async function init() {
  const context = {
    log,
    config,
    events: createNanoEvents(),
    services: createServiceHub(),
  };
  rewireTwitchClientLogging(context);
  await initPluginModules(context, [
    'core/web-server',
    'core/twitch-auth',
    'core/twitch-chatbot',
    'core/twitch-pubsub',
    'core/twitch-webhooks',
    'core/obs-websocket',
    'plugins/edison-carter-overlay',
    'plugins/stream-loader',
    'plugins/youtube-playlist-shuffle',
    'plugins/fireworks',
    'plugins/alerts-overlay',
    // 'plugins/debug',
  ]);
}

function rewireTwitchClientLogging(context) {
  const log = context.log.child({ name: 'TwitchClient' });
  const { default: LogLevel } = require('@d-fischer/logger/lib/LogLevel');
  const { default: NodeLogger } = require('@d-fischer/logger/lib/NodeLogger');
  const logLevelToPinoFunction = {
    [LogLevel.CRITICAL]: log.error.bind(log),
    [LogLevel.ERROR]: log.error.bind(log),
    [LogLevel.WARNING]: log.warn.bind(log),
    [LogLevel.INFO]: log.info.bind(log),
    [LogLevel.DEBUG1]: log.debug.bind(log),
    [LogLevel.DEBUG2]: log.debug.bind(log),
    [LogLevel.DEBUG3]: log.debug.bind(log),
    [LogLevel.TRACE]: log.trace.bind(log),
  };
  NodeLogger.prototype.log = (level, msg) => {    
    const logFn = logLevelToPinoFunction[level] || log.debug.bind(log);
    logFn({ msg });
  };
}

init().catch((err) => log.error(err));
