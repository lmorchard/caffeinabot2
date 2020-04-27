const fs = require('fs');
const TwitchClient = require('twitch').default;

const TWITCH_AUTH_FN = `${__dirname}/../data/twitchAuth.json`;

async function createTwitchClient(context) {
  const { config } = context;
  const { clientId, clientSecret } = config.twitch.api;
  const tokenData = JSON.parse(fs.readFileSync(TWITCH_AUTH_FN, 'utf-8'));
  const { access_token: accessToken, refresh_token: refreshToken } = tokenData;
  return TwitchClient.withCredentials(clientId, accessToken, undefined, {
    clientSecret,
    refreshToken,
    onRefresh: (token) => {
      updateTwitchCredentials(context, {
        ...tokenData,
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
      });
    },
  });
}

async function updateTwitchCredentials(context, tokenData) {
  fs.writeFileSync(TWITCH_AUTH_FN, JSON.stringify(tokenData, null, '  '));
}

module.exports = {
  createTwitchClient,
  updateTwitchCredentials,
};
