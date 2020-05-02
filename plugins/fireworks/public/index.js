import fireworks from './fireworks.js';
import { connectSocket } from '/js/lib/websockets.js';

async function init() {
  window.onload = () => {
    fireworks.loop();
  };
  connectSocket({
    onConnect({ socket, send }) {
      console.log('CONNECTED');
    },
    onMessage({ socket, send, event, data }) {
      switch (data.type) {
        case 'fireworks': {
          const number = Math.max(1, Math.min(200, parseInt(data.number)));
          const spread = Math.max(15, Math.min(360, parseInt(data.spread)));

          console.log('boom', number, spread);

          for (let idx = 0; idx < number; idx++) {
            const delay = parseInt(spread * Math.random());
            fireworks.randomLaunch(delay);
          }
        }
      }
    },
  });
}

init();
