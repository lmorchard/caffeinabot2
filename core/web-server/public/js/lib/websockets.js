export function connectSocket({
  onConnect = () => {},
  onMessage = () => {},
  options: { PING_INTERVAL = 1000, RECONNECT_INTERVAL = 3000 } = {},
}) {
  let socket;
  let pingTimer = null;
  let reconnectTimer = null;

  const send = (message) => {
    if (!socket) return;
    socket.send(JSON.stringify(message));
  };

  function schedulePing() {
    if (pingTimer) clearTimeout(pingTimer);
    pingTimer = setTimeout(() => send({ type: 'PING' }), PING_INTERVAL);
    scheduleReconnect();
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      console.log('reconnecting');
      reconnect();
    }, RECONNECT_INTERVAL);
  }

  const reconnect = () => {
    if (pingTimer) clearTimeout(pingTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    connect();
  };

  const connect = () => {
    const { protocol, host } = window.location;
    const wsUrl = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/`;

    console.log(`connecting websocket to ${wsUrl}`);
    if (socket) {
      socket.close();
    }
    socket = new WebSocket(wsUrl);
    scheduleReconnect();

    socket.addEventListener('open', (event) => {
      console.log('connected websocket');
      schedulePing();
      onConnect({ socket, send });
    });

    socket.addEventListener('close', (event) => {
      console.log('disconnected websocket');
      reconnect();
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') schedulePing();
        onMessage({ socket, send, data, event });
      } catch (err) {
        console.log('socket message error', err, event);
      }
    });
  };

  connect();
}
