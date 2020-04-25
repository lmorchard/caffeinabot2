/* global fireworks */

let socket, serverInstanceVersion;
let reconnectTimer;

function init() {
  window.onload = () => {
    fireworks.loop();
  };
  connectSocket();
}

const socketSend = (event, data = {}) => {
  if (!socket) return;
  socket.send(JSON.stringify({ ...data, event }));
};

function connectSocket() {
  const { protocol, host } = window.location;
  const wsUrl = `${protocol === "https:" ? "wss" : "ws"}://${host}/`;
  console.log("wsUrl", protocol, wsUrl);

  console.log(`Connecting websocket to ${wsUrl}`);
  socket = new WebSocket(wsUrl);
  
  socket.addEventListener("open", event => {
    console.log("Websocket connected!");
    if (reconnectTimer) clearInterval(reconnectTimer);
  });

  socket.addEventListener("close", event => {
    console.log("Websocket disconnected!");
    if (reconnectTimer) clearInterval(reconnectTimer);
    reconnectTimer = setInterval(connectSocket, 1000);
  });

  socket.addEventListener("message", event => {
    try {
      const data = JSON.parse(event.data);
      if (data.event in socketEventHandlers) {
        socketEventHandlers[data.event](data, event);
      }
    } catch (err) {
      console.log("socket message error", err, event);
    }
  });
}

const socketEventHandlers = {
  fireworks: (data) => {
    const number = Math.max(1, Math.min(200, parseInt(data.number)));
    const spread = Math.max(15, Math.min(360, parseInt(data.spread)));

    console.log("boom", number, spread);
    
    for (let idx = 0; idx < number; idx++) {
      const delay = parseInt(spread * Math.random());
      fireworks.randomLaunch(delay);
    }
  },
};

init();
