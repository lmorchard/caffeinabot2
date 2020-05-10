import { connectSocket } from '/js/lib/websockets.js';

const $ = (...args) => document.body.querySelector(...args);

async function init() {
  connectSocket({ 
    onConnect({ send, socket }) {
      const simulateFollowButton = document.body.querySelector('#simulate-follow');
      simulateFollowButton.addEventListener('click', ev => {
        console.log("SIMULATE FOLLOWING CLICKED");
        send({
          type: 'simulateFollowing',
          username: 'FooBarson',
        });
      });
    }
  });
}

window.onload = () => {
  init().catch(console.error);
}