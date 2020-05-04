const { createTwitchUserClient } = require('../../lib/twitch');
const ChatClient = require('twitch-chat-client').default;
const LogLevel = require('@d-fischer/logger/lib/LogLevel').default;

const tmi = require('tmi.js');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  const twitchOwnerClient = await createTwitchUserClient(context);
  const { userName: ownerUserName } = await twitchOwnerClient.getTokenInfo();

  const twitchChatClient = await createTwitchUserClient(context, true);
  const { userId, userName } = await twitchChatClient.getTokenInfo();
  const chat = await ChatClient.forTwitchClient(twitchChatClient, {
    channels: [ownerUserName],
    requestMembershipEvents: true,
  });
  await chat.connect();

  services.provide('twitch.chat.say', (channel, message) => {
    chat.say(channel, message);
  });

  const topicMessage = events.topic('twitch.chat.message');
  chat.onPrivmsg((channel, user, message, meta) => {
    topicMessage.emit({
      channel,
      user,
      message,
      meta,
      self: meta.userInfo.userId === userId,
    });
  });

  const topicRaid = events.topic('twitch.raid');
  chat.onRaid((channel, user, raidInfo, msg) => {
    const { displayName, viewerCount } = raidInfo;
    topicRaid.emit({ displayName, viewerCount });
  });

  const topicHosted = events.topic('twitch.hosted');
  chat.onHosted((channel, byChannel, auto, viewers) =>
    topicHosted.emit({ channel, byChannel, auto, viewers })
  );

  const topicJoin = events.topic('twitch.join');
  chat.onJoin((channel, user) => topicJoin.emit({ channel, user }));

  const topicPart = events.topic('twitch.part');
  chat.onPart((channel, user) => topicPart.emit({ channel, user }));

  const topicSub = events.topic('twitch.subscribed');
  chat.onSub((channel, user, subInfo, msg) => topicSub.emit(subInfo));

  const topicResub = events.topic('twitch.resubscribed');
  chat.onResub((channel, user, subInfo, msg) => topicResub.emit(subInfo));

  // TODO: relay the rest of the ChatClient events?
};
