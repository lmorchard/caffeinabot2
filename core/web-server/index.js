const express = require('express');
const http = require('http');
const uuid = require('uuid');
const WebSocket = require('ws');
const reload = require('reload');

const { webFrontendServe } = require('../../lib/plugins');

module.exports = async (context) => {
  const { config, log, events, services } = context;
  const { host, port } = config.web;

  const app = express();

  app.use(require('pino-http')({ logger: log }));

  const server = http.createServer(app);

  const websocketServer = new WebSocket.Server({ noServer: true });

  server.on('upgrade', function (request, socket, head) {
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.emit('connection', ws, request);
    });
  });

  websocketServer.on('connection', (ws, request) => {
    ws.id = uuid.v4();
    log.info({ msg: `WebSocket connection`, id: ws.id });

    ws.on('message', (message) => {
      log.trace({ msg: 'received', id: ws.id, message });
      events.emit('web:socket:received', { id: ws.id, message });
    });

    ws.on('close', () => {
      log.trace({ msg: 'closed', id: ws.id });
      events.emit('web:socket:closed', { id: ws.id });
    });
  });

  services.provide('web:socket:send', (id, message) => {
    websocketServer.clients.forEach((client) => {
      if (client.id !== id) return;
      if (client.readyState !== WebSocket.OPEN) return;
      client.send(JSON.stringify(message));
      log.trace({ msg: 'send', id, message });
    });
  });

  services.provide('web:socket:broadcast', (message) => {
    const seenIds = [];
    websocketServer.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;
      seenIds.push(client.id);
      client.send(JSON.stringify(message));
    });
    log.trace({ msg: 'broadcast', seenIds, message });
  });

  setInterval(() => {
    log.trace({ msg: 'ping' });
    services.call('web:socket:broadcast', {
      event: 'ping',
      systemTime: Date.now(),
    });
  }, 1000);

  const reloadReturned = await reload(app);

  const contextOut = {
    app,
    server,
    websocketServer,
    reloadReturned,
  };

  await webFrontendServe(
    {
      ...context,
      ...contextOut,
    },
    '/',
    `${__dirname}/public`
  );

  server.listen(port, host, () =>
    log.info(`listening at http://${host}:${port}`)
  );

  return contextOut;
};
