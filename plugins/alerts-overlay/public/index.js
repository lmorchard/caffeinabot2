import { connectSocket } from '/js/lib/websockets.js';

async function init() {
  connectSocket({
    onConnect({ socket, send }) {
      console.log('CONNECTED');
    },
    onMessage({ socket, send, event, data }) {
      console.log("SOCKET", data);
    }
  });
}

init();
