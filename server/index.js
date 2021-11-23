const needle = require('needle');
const config = require('dotenv').config();

const TOKEN = process.env.TWITTER_BEARER_TOKEN;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.field=public_metrics&expansions=author_id';

const rules = [
  {
    value: 'giveaway',
  },
];

// get stream rules
const getRules = async () => {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  console.log(response.body);
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

(async () => {
  let currentRules;
  try {
    await setRules();
    currentRules = await getRules();
  } catch (error) {
    console.log('ERRPR===', error);
    process.exit(1);
  }
})();