const { createTwitchClient } = require('../../lib/twitch');
const WebHookListener = require('twitch-webhooks').default;

const EV_TWITCH_WEBHOOKS_PREFIX = 'twitch:webhooks:';

module.exports = async (context) => {
  const { config, events, log, services } = context;
  const { host } = config.twitch.webhooks;

  const twitchClient = await createTwitchClient(context);
  const { userId } = await twitchClient.getTokenInfo();
  const listener = await WebHookListener.create(twitchClient, {
    hostName: host,
    port: 8090,
    reverseProxy: { port: 443, ssl: true },
  });
  listener.listen();

  const evName = name => `${EV_TWITCH_WEBHOOKS_PREFIX}${name}`;

  const reEmit = name => event => {
    log.debug('reEmit', {name, event});
    events.emit(evName(name), event);
  }

  listener.subscribeToModeratorEvents(userId, reEmit('moderatorEvents'));
  listener.subscribeToStreamChanges(userId, reEmit('streamChanges'));
  listener.subscribeToBanEvents(userId, reEmit('banEvents'));
  listener.subscribeToFollowsToUser(userId, reEmit('followsTo'));
  listener.subscribeToFollowsFromUser(userId, reEmit('followsFrom'));
  listener.subscribeToSubscriptionEvents(userId, reEmit('subscriptionEvents'));
  listener.subscribeToUserChanges(userId, reEmit('userChanges'));

  events.on('twitch:webhooks:followsTo', event => {
    log.debug('followsTo', event);
  })
};
