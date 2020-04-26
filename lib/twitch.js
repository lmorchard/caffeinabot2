const fs = require('fs');
const TwitchClient = require('twitch').default;

const TWITCH_AUTH_FN = `${__dirname}/../data/twitchAuth.json`;

async function createTwitchClient(context) {
  const { config } = context;
  const { clientId, clientSecret } = config.twitch.api;
  const { access_token: accessToken, refresh_token: refreshToken } = JSON.parse(
    fs.readFileSync(TWITCH_AUTH_FN, 'utf-8')
  );
  return TwitchClient.withCredentials(clientId, accessToken, undefined, {
    clientSecret,
    refreshToken,
    onRefresh: (token) => {
      fs.writeFileSync(
        TWITCH_AUTH_FN,
        JSON.stringify(
          {
            ...tokenData,
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
          },
          null,
          '  '
        )
      );
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
