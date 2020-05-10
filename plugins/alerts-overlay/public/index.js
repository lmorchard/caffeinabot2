import { connectSocket } from '/js/lib/websockets.js';

const $ = (...args) => document.body.querySelector(...args);

async function init() {
  connectSocket({
    onMessage({ socket, send, event, data }) {
      switch (data.type) {
        case 'following': {
          const { userId, userDisplayName } = data;
          const alertFollowing = $('#alert-following');
          $('#alert-following .display-name').innerText = userDisplayName;
          alertFollowing.classList.add('show');
          setTimeout(() => {
            alertFollowing.classList.remove('show');
            alertFollowing.classList.add('hide');
          }, 5000);
          break;
        }
      }
    },
  });
}

init();
