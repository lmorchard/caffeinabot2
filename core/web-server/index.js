const express = require('express');
const http = require('http');
const uuid = require('uuid');
const watch = require('watch');
const WebSocket = require('ws');
const reload = require('reload');
const { html, htmlPage } = require('../../lib/html');

module.exports = async (context) => {
  const { config, log, events, services } = context;
  const { host, port } = config.web;

  const app = express();

  app.use(require('pino-http')({ logger: log }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const homeLinks = {};
  app.get('/', async (req, res) => {
    return res.send(
      htmlPage(
        html`
          <h1>Index</h1>
          <ul>
            ${Object.entries(homeLinks)
              .map(
                ([urlpath, { title }]) => html`
                  <li><a href="${urlpath}">${title}</a></li>
                `
              )
              .join('\n')}
          </ul>
        `
      )
    );
  });

  const server = http.createServer(app);

  const websocketServer = new WebSocket.Server({ noServer: true });

  server.on('upgrade', function (request, socket, head) {
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.emit('connection', ws, request);
    });
  });

  websocketServer.on('connection', (client, request) => {
    client.id = uuid.v4();
    log.info({ msg: `WebSocket connection`, id: client.id });
    9;

    const send = (message) => client.send(JSON.stringify(message));

    client.on('message', (data) => {
      const message = JSON.parse(data);
      log.trace({ msg: 'received', id: client.id, message });
      if (message.type === 'PING') {
        send({ type: 'PONG' });
      }
      events.emit('web.socket.received', { id: client.id, message });
    });

    client.on('close', () => {
      log.trace({ msg: 'closed', id: client.id });
      events.emit('web.socket.closed', { id: client.id });
    });
  });

  services.provide('web.socket.send', (id, message) => {
    websocketServer.clients.forEach((client) => {
      if (client.id !== id) return;
      if (client.readyState !== WebSocket.OPEN) return;
      client.send(JSON.stringify(message));
      log.trace({ msg: 'send', id, message });
    });
  });

  services.provide('web.socket.broadcast', (message) => {
    const seenIds = [];
    websocketServer.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;
      seenIds.push(client.id);
      client.send(JSON.stringify(message));
    });
    log.trace({ msg: 'broadcast', seenIds, message });
  });

  const reloadReturned = await reload(app, {
    verbose: true,
    webSocketServerWaitStart: true,
  });

  events.on('init.complete', async () => {
    await reloadReturned.startWebSocketServer();
    log.debug({ msg: 'reload wss init' });
  });

  services.provide(
    'web.server.serveStatic',
    async ({ urlpath, filepath, addToIndex = true, metadata = {} }) => {
      log.trace({ msg: `serveStatic`, urlpath, filepath });
      app.use(urlpath, express.static(filepath));
      watch.watchTree(filepath, { interval: 1.0 }, (f, curr, prev) => {
        try {
          reloadReturned.reload();
        } catch (err) {
          log.error({ msg: 'reload failed', err });
        }
      });
      if (addToIndex) {
        await services.call('web.server.addToIndex', { urlpath, metadata });
      }
    }
  );

  services.provide(
    'web.server.addToIndex',
    async ({ urlpath, metadata = {} }) => {
      homeLinks[urlpath] = {
        title: metadata.title || urlpath,
        urlpath,
      };
    }
  );

  server.listen(port, host, () =>
    log.info(`listening at http://${host}:${port}`)
  );

  await services.call('web.server.serveStatic', {
    urlpath: '/',
    filepath: `${__dirname}/public`,
    addToIndex: false,
  });

  return {
    app,
    server,
    websocketServer,
    reloadReturned,
  };
};
