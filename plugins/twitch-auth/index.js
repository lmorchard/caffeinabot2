const express = require('express');
const fetch = require('node-fetch');
const { html } = require('../../lib/html');

const SCOPES = [
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
  'chat:edit',
  'chat:read',
  'whispers:read',
  'whispers:edit',
];

module.exports = async (context) => {
  const { app, log, config, moduleName } = context;
  const { host, port } = config.web;
  const { clientId, clientSecret } = config.twitch.api;

  const twitchAuthRouter = () => {
    const router = express.Router();

    router.get('/', async (req, res) => {
      const { code, error } = req.query;

      if (error) {
        return res.send(errorHtml(error));
      }

      if (code) {
        try {
          const params = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri(),
          });
          const tokenResp = await fetch(
            `https://id.twitch.tv/oauth2/token?${params.toString()}`,
            { method: 'POST' }
          );
          if (!tokenResp.ok) {
            res.send(errorHtml(await tokenResp.text()));
          } else {
            const tokenData = await tokenResp.json();
            return res.send(
              html({
                body: `
                <h1>Authorized</h1>
                <dl>
                  ${Object.entries(tokenData)
                    .map(([name, value]) => `<dt>${name}</dt><dd>${value}</dd>`)
                    .join('\n')}
                </dl>
                <textarea style="width: 100%; height: 5em">
                  TWITCH_REFRESH_TOKEN=${tokenData.refresh_token}
                  TWITCH_ACCESS_TOKEN=${tokenData.access_token}
                </textarea>
                <p><a href="${authorizeUrl()}">Authorize again</a></p>
                `,
              })
            );
          }
        } catch (err) {
          return res.send(errorHtml(err));
        }
      }

      res.send(
        html({
          body: `
          <h1>Authorize</h1>
          <a href="${authorizeUrl()}">Authorize</a>
        `,
        })
      );
    });

    return router;
  };

  const errorHtml = (error) =>
    html({
      body: `
      <h1>Error</h1>
      ${error.toString()}
      <p><a href="${authorizeUrl()}">Authorize again</a></p>
    `,
    });

  const redirectUri = () => `http://${host}:${port}/${moduleName}/`;

  const authorizeUrl = () => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: SCOPES.join(' '),
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  app.use(`/${moduleName}`, twitchAuthRouter());
};
