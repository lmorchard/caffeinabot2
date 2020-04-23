const express = require('express');
const session = require('express-session');
const http = require('http');
const uuid = require('uuid');
const WebSocket = require('ws');
const reload = require('reload');
const watch = require('watch');

const FRONTEND_PATH = __dirname + '/../frontend';

module.exports = async (context) => {
  const { log, config } = context;
  const { host, port, sessionSecret } = config.web;

  const userSockets = new Map();

  const app = express();

  const sessionParser = session({
    saveUninitialized: false,
    secret: sessionSecret,
    resave: false,
  });

  app.use(require('pino-http')(config.log));
  app.use(express.static(FRONTEND_PATH));
  app.use(sessionParser);

  app.post('/login', function (req, res) {
    const id = uuid.v4();
    req.log.info(`Updating session for user ${id}`);
    req.session.userId = id;
    res.send({ result: 'OK', message: 'Session updated' });
  });

  app.delete('/logout', function (req, res) {
    const ws = userSockets.get(req.session.userId);
    req.log.info('Destroying session');
    req.session.destroy(() => {
      if (ws) ws.close();
      res.send({ result: 'OK', message: 'Session destroyed' });
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on('upgrade', function (request, socket, head) {
    log.info('Parsing session from request...');

    sessionParser(request, {}, () => {
      if (!request.session.userId) {
        socket.destroy();
        return;
      }

      log.info('Session is parsed!');

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', (ws, request) => {
    const userId = request.session.userId;
    userSockets.set(userId, ws);

    ws.on('message', (message) => {
      log.info(`Received message ${message} from user ${userId}`);
    });

    ws.on('close', () => {
      userSockets.delete(userId);
    });
  });

  const reloadReturned = await reload(app);
  
  watch.watchTree(FRONTEND_PATH, { interval: 1.0 }, (f, curr, prev) => {
    reloadReturned.reload();
  });

  server.listen(port, host, () =>
    log.info(`web backend listening at http://${host}:${port}`)
  );

  return {
    app,
    server,
    wss,
  };
};
