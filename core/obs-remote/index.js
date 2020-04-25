const WebSocket = require('ws');
const uuid = require('uuid');

const SVC_OBS_REMOTE_SEND = 'obs:remote:send';
const EV_OBS_REMOTE_MESSAGE = 'obs:remote:message';
const EV_OBS_REMOTE_HEARTBEAT = 'obs:remote:heartbeat';

const RECONNECT_INTERVAL = 5000;

module.exports = async (context) => {
  const { config, events, log, services } = context;
  const { enabled, host, port, password } = config.obs.websocket;

  if (!enabled) {
    return;
  }

  services.provide(SVC_OBS_REMOTE_SEND, (type, message) => call(type, message));

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
        resolve(data);
        return;
      }
      switch (data['update-type']) {
        case 'Heartbeat': {
          resetReconnectTimer();
          return events.emit(EV_OBS_REMOTE_HEARTBEAT, data);
        }
      }
      log.debug({ msg: 'message', data });
      events.emit(EV_OBS_REMOTE_MESSAGE, data);
    });
  }

  connect();
};
