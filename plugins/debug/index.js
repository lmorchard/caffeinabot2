const express = require('express');
const { html, htmlPage } = require('../../lib/html');

module.exports = async (context) => {
  const { config, moduleName, app, log, events, services } = context;
  const urlpath = `/${moduleName}`;

  const router = express.Router();

  router.get('/', async (req, res) => {
    const allTopics = events.topics;
    const allServices = services.services;

    return res.send(htmlPage(html`
      <h2>Topics</h2>
      <ul>
        ${Object.keys(allTopics).map(name => html`<li>${name}</li>`).join('')}
      </ul>

      <h2>Services</h2>
      <ul>
        ${Object.keys(allServices).map(name => html`<li>${name}</li>`).join('')}
      </ul>
    `));
  });

  events.onMatch('.*', (name, ...args) => {
    log.trace({ msg: "TOPIC", topic: name });
  });

  app.use(urlpath, router);
  services.call('web.server.addToIndex', {
    urlpath,
    metadata: { title: 'Debug info' },
  });
};
