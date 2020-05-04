const {
  createTwitchUserClient,
  createTwitchAppClient,
} = require('../../lib/twitch');
const WebHookListener = require('twitch-webhooks').default;

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

  const topicName = (name) => `twitch.webhooks.${name}`;
  
  const topicStream = events.topic(topicName('stream'));
  listener.subscribeToStreamChanges(userId, ({ _data }) =>
    topicStream.emit(_data)
  );

  const topicFollowing = events.topic(topicName('following'));
  listener.subscribeToFollowsToUser(userId, ({ _data }) =>
    topicFollowing.emit(_data)
  );
};
