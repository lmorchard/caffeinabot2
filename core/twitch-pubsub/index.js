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

  await connectSocket();

  async function connectSocket() {
    let reconnectTimer = null;
    let pingTimer = null;

    let apiToken = await refreshAccessToken(context);
    log.trace({ msg: 'apiToken', apiToken });

    const channelData = await fetchChannelData(context, apiToken);
    const { _id: channelId } = channelData;
    log.trace({ msg: 'channel', channelData });

    if (ws) {
      log.warn({ msg: 'reconnecting' });
      ws.close();
    } else {
      log.info({ msg: 'connecting' });
    }
    ws = new WebSocket(PUBSUB_URL);

    const send = (data) => {
      log.trace({ msg: 'send', data });
      ws.send(JSON.stringify(data));
    };

    ws.on('open', function open() {
      send({
        type: 'LISTEN',
        nonce: uuid.v4(),
        data: {
          auth_token: apiToken.access_token,
          topics: ALL_TOPICS.map((topic) => `${topic}.${channelId}`),
        },
      });

      if (pingTimer) {
        clearInterval(pingTimer);
      }
      pingTimer = setInterval(() => {
        send({ type: 'PING' });
        reconnectTimer = setTimeout(() => {
          log.warn({ msg: 'pingTimeout' });
          connectSocket();
        }, RECONNECT_INTERVAL);
      }, PING_INTERVAL);
    });

    ws.on('close', () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pingTimer) {
        clearInterval(pingTimer);
      }
    });

    ws.on('message', (socketMessageRaw) => {
      try {
        const socketMessage = JSON.parse(socketMessageRaw);
        log.trace({ msg: 'message', socketMessage });
        switch (socketMessage.type) {
          case 'RECONNECT': {
            connectSocket();
            break;
          }
          case 'PONG': {
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
            }
            break;
          }
          case 'RESPONSE': {
            const { error } = socketMessage;
            if (error) {
              log.error({ msg: 'listen failed', error, socketMessage });
            } else {
              log.info({ msg: 'listen success' });
            }
            break;
          }
          case 'MESSAGE': {
            const { topic, message } = socketMessage.data;
            const [ topicName, topicChannelId ] = topic.split('.');
            const messageParsed = JSON.parse(message);
            const { type, data, data_object } = messageParsed;
            log.debug({
              msg: 'MESSAGE',
              topicName,
              messageParsed,
              type,
              data_object,
              data,
              raw: socketMessage.data,
            });
            break;
          }
          default: {
            log.warn({ msg: 'UNKNOWN', socketMessage });
          }
        }
      } catch (err) {
        log.error({ msg: 'messageFailed', error: err.toString() });
      }
    });
  }
};

async function refreshAccessToken(context) {
  const { config, log } = context;
  const { clientId, clientSecret, refreshToken } = config.twitch.api;
  const refreshParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  log.debug({ msg: 'refreshParams', refreshParams: refreshParams.toString() });
  const refreshResp = await fetch(`https://id.twitch.tv/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: refreshParams.toString(),
  });
  if (!refreshResp.ok) {
    log.error({
      msg: 'token refresh failed',
      error: refreshResp.status,
      errorBody: await refreshResp.text(),
    });
    throw new Error('access token refresh failed');
  }
  return refreshResp.json();
}

async function fetchChannelData(context, apiToken) {
  const { config, log } = context;
  const { clientId } = config.twitch.api;
  const channelResp = await fetch(`https://api.twitch.tv/kraken/channel`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.twitchtv.v5+json',
      'Client-ID': clientId,
      Authorization: `OAuth ${apiToken.access_token}`,
    },
  });
  if (!channelResp.ok) {
    log.error({
      msg: 'channel fetch failed',
      error: channelResp.status,
      errorBody: await channelResp.text(),
    });
    throw new Error('channel fetch failed');
  }
  return channelResp.json();
}
