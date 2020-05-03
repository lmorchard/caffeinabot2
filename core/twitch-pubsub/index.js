const PubSubClient = require('../../../twitch/packages/twitch-pubsub-client').default;
// const PubSubClient = require('twitch-pubsub-client').default;
const { createTwitchUserClient } = require('../../lib/twitch');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  const twitchClient = await createTwitchUserClient(context);
  const { userId } = await twitchClient.getTokenInfo();

  const pubSubClient = new PubSubClient();
  await pubSubClient.registerUserListener(twitchClient, userId);

  await pubSubClient.onRedemption(userId, message => {
    log.debug({ msg: 'redemption', message });
  });

  await pubSubClient.onFollowing(userId, message => {
    log.debug({ msg: 'following', ...message._data });
  });
};
