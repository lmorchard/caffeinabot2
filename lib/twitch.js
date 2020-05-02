const fs = require('fs');
const {
  default: LogLevel,
  LogLevelToConsoleFunction,
} = require('@d-fischer/logger/lib/LogLevel');
const TwitchClient = require('twitch').default;

const TWITCH_USER_ACCESS_TOKEN_FN = `${__dirname}/../data/twitchUserToken.json`;
const TWITCH_APP_ACCESS_TOKEN_FN = `${__dirname}/../data/twitchAppToken.json`;

const TWITCH_SCOPES = [
  'bits:read',
  'channel_read',
  'channel_editor',
  'channel_check_subscription',
  'channel_commercial',
  'channel_subscriptions',
  'channel:moderate',
  'channel:read:subscriptions',
  'channel:read:redemptions',
  'clips:edit',
  'user:edit',
  'user:edit:broadcast',
  'user:read:email',
  'channel:moderate',
  'moderation:read',
  'chat:edit',
  'chat:read',
  'whispers:read',
  'whispers:edit',
];

async function createTwitchUserClient(context) {
  const { config, log } = context;
  const { clientId, clientSecret } = config.twitch.api;
  const tokenData = await loadTwitchUserCredentials(context);
  const { access_token: accessToken, refresh_token: refreshToken } = tokenData;
  return TwitchClient.withCredentials(
    clientId,
    accessToken,
    undefined,
    {
      clientSecret,
      refreshToken,
      onRefresh: (newToken) => {
        updateTwitchUserCredentials(context, {
          ...tokenData,
          access_token: newToken.accessToken,
          refresh_token: newToken.refreshToken,
        });
      },
    },
    {
      logLevel: LogLevel.TRACE,
    }
  );
}

async function createTwitchAppClient(context) {
  const { config, log } = context;
  const { clientId, clientSecret } = config.twitch.api;
  const tokenData = await loadTwitchAppCredentials(context);
  const { access_token: accessToken, refresh_token: refreshToken } = tokenData;
  return TwitchClient.withCredentials(
    clientId,
    accessToken,
    undefined,
    {},
    {
      logLevel: LogLevel.TRACE,
    }
  );
}

async function loadTwitchAppCredentials(context) {
  return JSON.parse(fs.readFileSync(TWITCH_APP_ACCESS_TOKEN_FN));
}

async function updateTwitchAppCredentials(context, tokenData) {
  fs.writeFileSync(
    TWITCH_APP_ACCESS_TOKEN_FN,
    JSON.stringify(tokenData, null, '  ')
  );
}

async function loadTwitchUserCredentials(context) {
  return JSON.parse(fs.readFileSync(TWITCH_USER_ACCESS_TOKEN_FN));
}

async function updateTwitchUserCredentials(context, tokenData) {
  fs.writeFileSync(
    TWITCH_USER_ACCESS_TOKEN_FN,
    JSON.stringify(tokenData, null, '  ')
  );
}

module.exports = {
  TWITCH_SCOPES,
  createTwitchUserClient,
  createTwitchAppClient,
  loadTwitchUserCredentials,
  updateTwitchUserCredentials,
  loadTwitchAppCredentials,
  updateTwitchAppCredentials,
};
