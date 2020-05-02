export function connectSocket({
  onConnect = () => {},
  onMessage = () => {},
  options: { PING_INTERVAL = 2000, RECONNECT_INTERVAL = 5000 } = {},
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
    if (reconnectTimer) clearTimeout(reconnectTimer);
    pingTimer = setTimeout(() => send({ type: 'PING' }), PING_INTERVAL);
    reconnectTimer = setTimeout(() => {
      console.log('reconnecting');
      connect();
    }, RECONNECT_INTERVAL);
  }

  const connect = () => {
    const { protocol, host } = window.location;
    const wsUrl = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/`;

    console.log(`connecting websocket to ${wsUrl}`);
    schedulePing();

    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', (event) => {
      console.log('connected websocket');
      schedulePing();
      onConnect({ socket, send });
    });

    socket.addEventListener('close', (event) => {
      console.log('disconnected websocket');
      setTimeout(connect, RECONNECT_INTERVAL);
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
