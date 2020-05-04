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
  const chatClient = await ChatClient.forTwitchClient(twitchChatClient, {
    channels: [ownerUserName],
    requestMembershipEvents: true,
  });
  await chatClient.connect();

  services.provide('twitch.chat.say', (channel, message) => {
    chatClient.say(channel, message);
  });

  const topicMessage = events.topic('twitch.chat.message');
  chatClient.onPrivmsg((channel, user, message, meta) => {
    const self = meta.userInfo.userId === userId;
    topicMessage.emit({
      channel,
      user,
      message,
      self,
      meta,
    });
  });
};
