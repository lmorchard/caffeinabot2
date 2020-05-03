import { connectSocket } from '/js/lib/websockets.js';

async function init() {
  connectSocket({
    onMessage({ socket, send, event, data }) {
      switch (data.type) {
        case 'following': {
          const { userId, userDisplayName, followDate } = data.details;
          console.log('following', userDisplayName);
          break;
        }
      }
    },
  });
}

init();
