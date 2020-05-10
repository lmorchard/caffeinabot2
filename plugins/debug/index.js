const express = require('express');
const { html, htmlPage } = require('../../lib/html');

module.exports = async (context) => {
  const { config, moduleName, app, log, events, services } = context;
  const urlpath = `/${moduleName}`;

  const router = express.Router();

  const topicWebsocketReceived = events.topic('web.socket.received');

  router.get('/', async (req, res) => {
    const allTopics = events.topics;
    const allServices = services.services;

    return res.send(
      htmlPage(
        html`
          <script type="module" src="index.js"></script>
          <script src="/reload/reload.js"></script>
        `,
        html`
          <h2>Debug message</h2>
          <p>
            <button id="simulate-follow">Simulate Follow Event</button>
          </p>
          <h2>Topics</h2>
          <ul>
            ${Object.keys(allTopics)
              .map((name) => html`<li>${name}</li>`)
              .join('')}
          </ul>

          <h2>Services</h2>
          <ul>
            ${Object.keys(allServices)
              .map((name) => html`<li>${name}</li>`)
              .join('')}
          </ul>
        `
      )
    );
  });

  topicWebsocketReceived.on(({ id, message }) => {
    switch (message.type) {
      case 'simulateFollowing': {
        log.debug({ msg: 'SIMULATE FOLLOW RECEIVED' });
        services.call('web.socket.broadcast', {
          type: 'following',
          detail: {
            userId: '8675309',
            userDisplayName: 'J Random Hacker',
            followDate: (new Date()).toISOString(),             
          }
        });
      }
    }
  });

  events.onMatch('.*', (name, ...args) => {
    log.trace({ msg: 'TOPIC', topic: name });
  });

  app.use(urlpath, router);
  services.call('web.server.addToIndex', {
    urlpath,
    metadata: { title: 'Debug info' },
  });
};
