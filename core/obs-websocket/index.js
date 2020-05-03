const WebSocket = require('ws');
const uuid = require('uuid');
 
const RECONNECT_INTERVAL = 5000;

module.exports = async (context) => {
  const { config, events, log, services } = context;
  const { enabled, host, port, password } = config.obs.websocket;

  if (!enabled) {
    return;
  }

  const topicMessage = events.topic('obs.message');
  const topicHeartbeat = events.topic('obs.heartbeat');
  
  services.provide('obs.send', (type, message) => call(type, message));

  const pendingRequests = {};

  let ws;

  function send(data) {
    const messageId = uuid.v4();
    const msg = { 'message-id': messageId, ...data };
    log.trace({ msg: 'send', msg });
    ws.send(JSON.stringify(msg));
    return messageId;
  }

  async function call(requestType, data = {}) {
    return new Promise((resolve, reject) => {
      const id = send({
        'request-type': requestType,
        ...data,
      });
      // todo schedule a timeout?
      pendingRequests[id] = [resolve, reject];
    });
  }

  let reconnectTimer = null;
  function resetReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    reconnectTimer = setTimeout(() => {
      log.warn('reconnecting');
      connect();
    }, RECONNECT_INTERVAL);
  }

  function connect() {
    log.info({ msg: 'connecting' });

    resetReconnectTimer();

    ws = new WebSocket(`http://${host}:${port}`);

    ws.on('open', async () => {
      log.trace({ msg: 'open' });
      // TODO: login if password configured
      const version = await call('GetVersion');
      log.trace({ msg: 'version', ...version });
      const heartbeat = await call('SetHeartbeat', { enable: true });
      log.trace({ msg: 'heartbeat', ...heartbeat });
      log.info({
        msg: 'connected',
        version: version['obs-studio-version'],
      });
    });

    ws.on('close', () => {
      log.trace({ msg: 'close' });
    });

    ws.on('message', (raw) => {
      const data = JSON.parse(raw);
      if (data['message-id'] && data['message-id'] in pendingRequests) {
        const [resolve] = pendingRequests[data['message-id']];
        return resolve(data);
      }
      switch (data['update-type']) {
        case 'Heartbeat': {
          resetReconnectTimer();
          return topicHeartbeat.emit(data);
        }
      }
      log.debug({ msg: 'message', data });
      topicMessage.emit(data);
    });
  }

  connect();
};
