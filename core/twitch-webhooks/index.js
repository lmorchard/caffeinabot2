const {
  createTwitchUserClient,
  createTwitchAppClient,
} = require('../../lib/twitch');
const WebHookListener = require('twitch-webhooks').default;

const TOPIC_TWITCH_WEBHOOKS_PREFIX = 'twitch.webhooks';
const topicName = (name) => `${TOPIC_TWITCH_WEBHOOKS_PREFIX}.${name}`;

module.exports = async (context) => {
  const { config, events, log, services } = context;
  const {
    host: hostName,
    port,
    hookValidity,
    reverseProxy: {
      pathPrefix: webhooksProxyPathPrefix = '/',
      port: webhooksProxyPort = 443,
      ssl: webhooksProxySsl = true,
    },
  } = config.twitch.webhooks;

  const twitchUserClient = await createTwitchUserClient(context);
  const { userId } = await twitchUserClient.getTokenInfo();

  const twitchAppClient = await createTwitchAppClient(context);
  const hooksResult = await twitchAppClient.helix.webHooks.getSubscriptions();
  const hooks = await hooksResult.getAll();
  for (const hook of hooks) {
    log.debug({ msg: 'existing subscription', ...hook._data });
  }

  const listener = await WebHookListener.create(twitchAppClient, {
    hostName,
    port,
    hookValidity,
    reverseProxy: {
      pathPrefix: webhooksProxyPathPrefix,
      port: webhooksProxyPort,
      ssl: webhooksProxySsl,
    },
  });
  listener.listen();

  const topicFollowing = events.topic(topicName('following'));
  listener.subscribeToFollowsToUser(
    userId,
    ({
      userId,
      userDisplayName,
      followDate,
    }) =>
      topicFollowing.emit({
        userId,
        userDisplayName,
        followDate,
      })
  );
};
