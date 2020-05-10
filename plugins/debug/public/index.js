import { connectSocket } from '/js/lib/websockets.js';
import { $, $$ } from '/js/lib/dom.js';

async function init() {
  connectSocket({ 
    onConnect({ send, socket }) {
      $$('sam-say').addEventListener('click', ev => {
        send({
          type: 'testSamSay',
          text: 'Hello world, this is not Amiga speaking. It is me, SAM!',
        });
      });

      $$('simulate-follow').addEventListener('click', ev => {
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