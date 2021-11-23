const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const needle = require('needle');
const config = require('dotenv').config();

const TOKEN = process.env.TWITTER_BEARER_TOKEN;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';

const rules = [
  {
    value: 'bitcoin',
  },
];

const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'));
});

// get stream rules
const getRules = async () => {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
};

// set stream rules
const setRules = async () => {
  const data = {
    add: rules,
  };
  const response = await needle('post', rulesURL, data, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
  });

  return response.body;
};

// delete stream rules
const deleteRules = async rules => {
  if (!Array.isArray(rules.data)) return null;

  const ids = rules.data.map(rule => rule.id);

  const data = {
    delete: {
      ids,
    },
  };
  const response = await needle('post', rulesURL, data, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
  });

  return response.body;
};

const streamTweets = async socket => {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  stream.on('data', data => {
    try {
      const json = JSON.parse(data);
      // console.log(json);
      socket.emit('tweet', json);
    } catch (error) {}
  });
};

io.on('connection', async () => {
  console.log('client connected');

  let currentRules;
  try {
    currentRules = await getRules();
    await deleteRules(currentRules);
    await setRules();
  } catch (error) {
    console.log('ERRPR===', error);
    process.exit(1);
  }

  streamTweets(io);
});

server.listen(PORT, () => {
  console.log('LISTENING!!');
});

// (async () => {
//   let currentRules;
//   try {
//     currentRules = await getRules();
//     await deleteRules(currentRules);
//     await setRules();
//   } catch (error) {
//     console.log('ERRPR===', error);
//     process.exit(1);
//   }

//   streamTweets();
// })();
