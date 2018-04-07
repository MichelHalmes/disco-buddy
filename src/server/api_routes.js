
const path = require('path');
const config  = require('../../config.js');

const USR = require('./stores').USR;
const SA = require('./stores').SA;
const LOG_SA = require('./stores').LOG_SA;
const LOG_MATCH = require('./stores').LOG_MATCH;
const LOG_TWEET = require('./stores').LOG_TWEET;
const SONGS = require('./stores').SONGS;



module.exports = function(app, playerSockets, monitorSocket) {

// POST LOGIN ++++++++++++++++++++++++++++++++++++
app.post('/api/login', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;

  const existingUser = USR.findOne({username});
  if (existingUser) {
    res.status(403).send('A user with this username exists already!');
  } else {
    const points = email ? config.POINTS_EMAIL : 0
    USR.insert({username, email, points});
    res.json({points});
    monitorSocket.emit('send:newsEvent', {type: 'login', points, data: {username}});
  }
});

// GET CODE ++++++++++++++++++++++++++++++++++++
let nextCodeIdx = 1;
let nextSongIdx = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SONG_CODES = shuffle([...Array(10000).keys()])

app.get('/api/code', (req, res) => {
  const startTime = Date.now()
  const username = Buffer.from(req.headers.authorization, 'base64').toString();

  const usr = USR.findOne({username});
  if (!usr) {
    console.error('/api/code: Could not find user :' + username);
    res.status(401).send(`A user with the name ${username} does not exist!`);
    return;
  }

  const saSongIdxAll = SA.find({}).map((sa) => sa.songIdx);
  let nbUsers = saSongIdxAll.length;
  const previousAllocation = SA.findOne({username});
  if (previousAllocation) {
    const songDuration = (Date.now() - previousAllocation.meta.created) / 1000;
    if (songDuration > 0.95 * config.TIME_TO_PLAY_S && songDuration < 1.25 * config.TIME_TO_PLAY_S) { // End of song without inactivity
      usr.points += config.POINTS_SONG_END;
      USR.update(usr);
    } else if (songDuration < config.TIME_TO_NEXT_S) {
      console.error(`/api/code: Premature 'Next' for ${username} after only ${songDuration}s`)
      res.json({code: previousAllocation.code, points: usr.points});
      return;
    }
    SA.remove(previousAllocation);
  } else { // This is a new user, that was not yet in SA
    nbUsers += 1;
  }

  let codeIdx = nextCodeIdx;
  nextCodeIdx = (nextCodeIdx+1) % 10000;
  let code = SONG_CODES[codeIdx]
  code = '000' + code.toString();
  code = code.slice(-4);

  const songCounts = {};
  saSongIdxAll.forEach(function (songIdx) {
    songCounts[songIdx] = songCounts[songIdx] ? songCounts[songIdx]+1 : 1;
  });

  const logSongIdxUser = LOG_SA.find({username}).map((log) => log.songIdx);
  let songIdxBest;
  Object.keys(songCounts).forEach(function (songIdx) {
    songIdx = parseInt(songIdx)
    if ((songIdxBest == undefined || songCounts[songIdx] < songCounts[songIdxBest])
      && logSongIdxUser.indexOf(songIdx) == -1) {
        songIdxBest = songIdx;
    }
  });

  if (songIdxBest == undefined ||  // The player has heard everything
    (nbUsers != 1 && (songCounts[songIdxBest]-1) / (nbUsers - 1) > config.TARGET_PROBA_MATCH)) { // There are too many players per song. We need to add songs
    songIdxBest = nextSongIdx;
    nextSongIdx = (nextSongIdx + 1) % SONGS.length;
  }

  SA.insert({code, songIdx: songIdxBest, username, didMatch: false});
  LOG_SA.insert({songIdx: songIdxBest, username});
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({code, points: usr.points});

  console.log(`/api/code [${Date.now() - startTime}ms]: Code ${code} for '${username}': ${SONGS[songIdxBest]}`);

  monitorSocket.emit('send:statistics', {nbUsers, nbSongs: Object.keys(songCounts).length});
});


// GET SONG ++++++++++++++++++++++++++++++++++++
app.get('/api/song/:code', (req, res) => {
  const code = req.params.code;
  const allocation = SA.findOne({code});

  if (allocation) {
    const songFile = SONGS[allocation.songIdx] + '.mp3';
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(config.SONG_FOLDER, songFile));
  } else {
    res.status(404).send('The requested code does not correspond to any song!');
  }
});

// GET SYNCTIME ++++++++++++++++++++++++++++++++++++
app.get('/api/synctime', (req, res) => {
  res.json({time: new Date().getTime()});
});

// POST BUDDYCODE ++++++++++++++++++++++++++++++++++++
app.post('/api/buddycode', (req, res) => {
  const startTime = Date.now()
  const username = req.body.username;
  let buddyCode = req.body.buddyCode;

  const usrUser = USR.findOne({username});
  if (!usrUser) {
    res.status(401).send(`A user with the name ${username} does not exist!`);
    return;
  }

  buddyCode = '000' + buddyCode.toString();
  buddyCode = buddyCode.slice(-4);
  const saBuddy = SA.findOne({code: buddyCode});
  const saUser = SA.findOne({username});

  if (saUser && saBuddy // Has allocation
        && saUser.songIdx == saBuddy.songIdx // Same song
        && !saUser.didMatch && !saBuddy.didMatch // Cannot rematch
        && saUser != saBuddy // Cannot match with oneself
      ) { 
    saUser.didMatch = true
    SA.update(saUser)
    saBuddy.didMatch = true
    SA.update(saBuddy)
   
    usrUser.points += config.POINTS_MATCH;
    USR.update(usrUser);

    const usrBuddy = USR.findOne({username: saBuddy.username});
    usrBuddy.points += config.POINTS_MATCH;
    USR.update(usrBuddy);

    res.json({accepted: true, points: usrUser.points, buddyUsername: usrBuddy.username});

    const buddySocket = playerSockets.connected[usrBuddy.socketId]
    if (buddySocket) {
      buddySocket.emit('code:match',
        {username: usrBuddy.username, buddyUsername: usrUser.username, points: usrBuddy.points}
      );
    } else {
      console.error(`/api/buddycode: No socket found for: ${usrBuddy.username}`);
    }

    monitorSocket.emit('send:newsEvent', {type: 'match', points: config.POINTS_MATCH, data:
      {username, buddyUsername: usrBuddy.username, song: SONGS[saUser.songIdx]}});

    LOG_MATCH.insert({username, buddyUsername: usrBuddy.username, songIdx: saUser.songIdx, song: SONGS[saUser.songIdx]});
    console.log(`/api/buddycode [${Date.now() - startTime}ms]: '${username}' matched with '${usrBuddy.username}: ${SONGS[saUser.songIdx]}`);

  } else {
    res.json({accepted: false, points: usrUser.points});
  }
});

// POST TWEET ++++++++++++++++++++++++++++++++++++
app.post('/api/tweet', (req, res) => {
  const username = req.body.username;
  const message = req.body.message;

  const usr = USR.findOne({username});
  if (usr) {
    monitorSocket.emit('send:newsEvent', {type: 'message', points: config.POINTS_TWEET, data: {username, message}});
    res.json({points: usr.points});
    usr.points += config.POINTS_TWEET;
    USR.update(usr);
    LOG_TWEET.insert({ username, message });
  } else {
    res.status(401).send(`A user with the name ${username} does not exist!`);
  }
});

};
