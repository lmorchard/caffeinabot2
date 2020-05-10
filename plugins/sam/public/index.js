import { connectSocket } from '/js/lib/websockets.js';
import SamJs from './samjs.esm.js';

async function init() {
  let sam = new SamJs();

  connectSocket({
    async onConnect({ send }) {
      // await sam.speak("Web socket connected for SAM");      
    },
    onMessage({ socket, send, event, data }) {
      switch (data.type) {
        case 'samSay': {
          const { text, phonetic = '' } = data;
          sam.speak(text, phonetic);
          break;
        }
      }
    },
  });
}

window.onload = () => {
  init().catch(console.err);
}
