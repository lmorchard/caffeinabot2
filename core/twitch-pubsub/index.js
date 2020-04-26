const { createTwitchClient } = require('../../lib/twitch');

const uuid = require('uuid');
const fetch = require('node-fetch');
const WebSocket = require('ws');

module.exports = async (context) => {
  const { config, events, log, services } = context;

  const PUBSUB_URL = 'wss://pubsub-edge.twitch.tv';
  const PING_INTERVAL = 10000;
  const RECONNECT_INTERVAL = 30000;
  const ALL_TOPICS = [
    'channel-bits-events-v1',
    'channel-bits-events-v2',
    'channel-bits-badge-unlocks',
    'channel-points-channel-v1',
    'chat_moderator_actions',
    'whispers',
    'channel-subscribe-events-v1',
    'video-playback',
    'following',
  ];

  let ws = null;

  await connect();

  const send = (data) => {
    log.trace({ msg: 'send', data });
    ws.send(JSON.stringify(data));
  };

  function handleTopicMessage(socketMessage) {
    const { topic, message } = socketMessage.data;
    const [topicName, topicChannelId] = topic.split('.');

    switch (topicName) {
      case 'following': {
        const { display_name, username, user_id } = JSON.parse(message);
        log.debug({ msg: 'following', display_name, username, user_id });
        events.emit('twitch:pubsub:following', {
          display_name,
          username,
          user_id,
        });
        break;
      }
      /*
      case 'channel-points-channel-v1': {
        break;
      }
      */
      default: {
        log.debug({ msg: 'MESSAGE', topicName, message });
      }
    }
  }

  let reconnectTimer = null;
  function schedulePing() {
    setTimeout(() => {
      log.trace('ping');
      send({ type: 'PING' });
    }, PING_INTERVAL);

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    reconnectTimer = setTimeout(() => {
      log.warn('reconnecting');
      connect();
    }, RECONNECT_INTERVAL);
  }

  async function connect() {
    const twitchClient = await createTwitchClient(context);
    const { userId } = await twitchClient.getTokenInfo();
    const accessToken = await twitchClient.getAccessToken();
  
    if (ws) {
      log.warn({ msg: 'reconnecting' });
      ws.close();
    } else {
      log.info({ msg: 'connecting' });
    }

    ws = new WebSocket(PUBSUB_URL);

    ws.on('open', function open() {
      send({
        type: 'LISTEN',
        nonce: uuid.v4(),
        data: {
          auth_token: accessToken.accessToken,
          topics: ALL_TOPICS.map((topic) => `${topic}.${userId}`),
        },
      });
    });

    ws.on('close', () => {
      log.trace({ msg: 'close' });
    });

    ws.on('message', (socketMessageRaw) => {
      const socketMessage = JSON.parse(socketMessageRaw);
      log.trace({ msg: 'message', socketMessage });
      switch (socketMessage.type) {
        case 'RESPONSE': {
          const { error } = socketMessage;
          if (error) {
            return log.error({ msg: 'listen failed', error, socketMessage });
          }
          log.info({ msg: 'listening' });
          return schedulePing();
        }
        case 'PONG':
          log.trace('pong');
          return schedulePing();
        case 'RECONNECT':
          return connect();
         case 'MESSAGE':
          return handleTopicMessage(socketMessage);
        default:
          log.warn({ msg: 'UNKNOWN', socketMessage });
      }
    });
  }
};
