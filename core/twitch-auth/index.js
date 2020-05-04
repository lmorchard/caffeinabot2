const fs = require('fs');
const express = require('express');
const fetch = require('node-fetch');
const { html, htmlPage } = require('../../lib/html');
const {
  loadTwitchUserCredentials,
  updateTwitchUserCredentials,
  loadTwitchAppCredentials,
  updateTwitchAppCredentials,
  TWITCH_SCOPES,
} = require('../../lib/twitch');

module.exports = async (context) => {
  const { app, log, config, moduleName, services } = context;
  const { hostname, host, port } = config.web;
  const { clientId, clientSecret } = config.twitch.api;

  const urlpath = `/${moduleName}`;

  const router = express.Router();

  router.get('/', async (req, res) => {
    const { code, error } = req.query;
    if (error) {
      return res.send(htmlError(error));
    }
    if (code) {
      return handleCodeRedirect(req, res, code);
    }
    let appToken = {};
    let userToken = {};
    let chatBotToken = {};
    try {
      appToken = await loadTwitchAppCredentials(context);
      userToken = await loadTwitchUserCredentials(context);
      chatBotToken = await loadTwitchUserCredentials(context, true);
    } catch (err) {
      // no-op
    }
    res.send(htmlIndex({ appToken, userToken, chatBotToken }));
  });

  router.post('/', async (req, res) => {
    const tokenResp = await fetch(appTokenUrl(), { method: 'POST' });
    if (!tokenResp.ok) {
      return res.send(htmlError(await tokenResp.text()));
    }
    const tokenData = await tokenResp.json();
    await updateTwitchAppCredentials(context, tokenData);
    return res.redirect(urlpath);
  });

  const handleCodeRedirect = async (req, res, code) => {
    try {
      const chatbot = req.query.state === 'chatbot';
      const tokenResp = await fetch(userTokenUrl({ code, chatbot }), {
        method: 'POST',
      });
      if (!tokenResp.ok) {
        return res.send(htmlError(await tokenResp.text()));
      }
      const tokenData = await tokenResp.json();
      await updateTwitchUserCredentials(context, tokenData, chatbot);
      return res.redirect(urlpath);
    } catch (err) {
      return res.send(htmlError(err));
    }
  };

  const redirectUri = () => `http://${hostname}:${port}/${moduleName}/`;

  const authorizeUserUrl = ({ chatbot = false } = {}) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: TWITCH_SCOPES.join(' '),
      state: chatbot ? 'chatbot' : 'user',
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  const userTokenUrl = ({ code, chatbot = false }) => {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(),
    });
    return `https://id.twitch.tv/oauth2/token?${params.toString()}`;
  };

  const appTokenUrl = () => {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: TWITCH_SCOPES.join(' '),
    });
    return `https://id.twitch.tv/oauth2/token?${params.toString()}`;
  };

  const htmlIndex = ({ appToken, userToken, chatBotToken }) =>
    htmlPage(html`
      <h1>twitch-auth</h1>

      <section>
        <h2>App Access Token</h2>
        <p>Expires in: ${appToken.expires_in}</p>
        <form method="POST">
          <input type="hidden" name="appAccess" value="1" />
          <button type="submit">Authorize app</button>
        </form>
      </section>

      <section>
        <h2>User Access Token</h2>
        <p>Expires in: ${userToken.expires_in}</p>
        <a href="${authorizeUserUrl()}">Authorize user</a>
      </section>

      <section>
        <h2>Chatbot Access Token</h2>
        <p>Expires in: ${chatBotToken.expires_in}</p>
        <a href="${authorizeUserUrl({ chatbot: true })}">Authorize user</a>
      </section>
    `);

  const htmlError = (error) =>
    htmlPage(html`
      <h1>Error</h1>
      ${error.toString()}
      <p><a href="${urlpath}">Try again</a></p>
    `);

  app.use(urlpath, router);
  services.call('web.server.addToIndex', {
    urlpath,
    metadata: { title: 'Twitch Auth' },
  });
};
