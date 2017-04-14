
const path = require('path');
const config  = require('../../config.js');

const USR = require('./stores').USR;
const SA = require('./stores').SA;
const LOG_SA = require('./stores').LOG_SA;
const LOG_MATCH = require('./stores').LOG_MATCH;
const SONGS = require('./stores').SONGS;



module.exports = function(app, matchSockets, monitorSocket) {

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
let nextCode = 1;
let nextSongIdx = 0;
//
// USR.insert({username: 'The Player', email: '', points: 9, socketId: undefined});
// USR.insert({username: 'Mary', email: '', points: 10});
// USR.insert({username: 'Kate', email: '', points: 30});
// USR.insert({username: 'Peter', email: '', points: -5});
// USR.insert({username: 'John', email: '', points: 20});
//
// // LOG_SA.insert({username: 'michel', songIdx: '0'});
// // LOG_SA.insert({username: 'michel', songIdx: '0'});
// SA.insert({code: '0000', songIdx: 1, username: 'Mary'});
// SA.insert({code: '0001', songIdx: 1, username: 'Kate'});
// SA.insert({code: '0002', songIdx: 0, username: 'Peter'});
// SA.insert({code: '0003', songIdx: 0, username: 'John'});
// nextCode = 4;
// nextSongIdx = 0;




app.get('/api/code', (req, res) => {
  console.time('NewCode');
  const username = Buffer.from(req.headers.authorization, 'base64').toString();

  const usr = USR.findOne({username});
  if (!usr) {
    console.log('Could not find user :' + username);
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
      res.json({code: previousAllocation.code, points: usr.points});
      return;
    }
    SA.remove(previousAllocation);
  } else { // This is a new user, that was not yet in SA
    nbUsers += 1;
  }

  let code = nextCode;
  nextCode = (nextCode+1) % 10000;
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

  SA.insert({code, songIdx: songIdxBest, username});
  LOG_SA.insert({songIdx: songIdxBest, username});
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({code, points: usr.points});

  console.log(`Code ${code} for ${username}; playing: ${SONGS[songIdxBest]}`);

  monitorSocket.emit('send:statistics', {nbUsers, nbSongs: Object.keys(songCounts).length});
  console.timeEnd('NewCode');
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

// POST MATCHCODE ++++++++++++++++++++++++++++++++++++


app.post('/api/matchcode', (req, res) => {
  const username = req.body.username;
  let matchCode = req.body.matchCode;
  console.log('/api/matchcode', username, matchCode);

  const usrUser = USR.findOne({username});
  if (!usrUser) {
    res.status(401).send(`A user with the name ${username} does not exist!`);
    return;
  }

  matchCode = '000' + matchCode.toString();
  matchCode = matchCode.slice(-4);
  const saMatch = SA.findOne({code: matchCode});
  const saUser = SA.findOne({username});

  if (saUser && saMatch && saUser.songIdx == saMatch.songIdx) {
    SA.remove(saUser);
    SA.remove(saMatch);

    usrUser.points += config.POINTS_MATCH;
    USR.update(usrUser);

    const usrMatch = USR.findOne({username: saMatch.username});
    usrMatch.points += config.POINTS_MATCH;
    USR.update(usrMatch);

    res.json({accepted: true, points: usrUser.points, matchUsername: usrMatch.username});

    const matchSocket = matchSockets.connected[usrMatch.socketId]
    if (matchSocket) {
      matchSocket.emit('code:match',
        {username: usrMatch.username, matchUsername: usrUser.username, points: usrMatch.points}
      );
    } else {
      console.log('No socket found for :' + usrMatch.username);
    }

    monitorSocket.emit('send:newsEvent', {type: 'match', points: config.POINTS_MATCH, data:
      {username, matchUsername: usrMatch.username, song: SONGS[saUser.songIdx]}});

    LOG_MATCH.insert({username, matchUsername: usrMatch.username, songIdx: saUser.songIdx, song: SONGS[saUser.songIdx]});

  } else {
    res.json({accepted: false, points: usrUser.points});
  }
});

// POST LOGIN ++++++++++++++++++++++++++++++++++++"

app.post('/api/tweet', (req, res) => {
  const username = req.body.username;
  const message = req.body.message;


  const usr = USR.findOne({username});
  if (usr) {
    usr.points += config.POINTS_TWEET;
    USR.update(usr);
    monitorSocket.emit('send:newsEvent', {type: 'message', points: config.POINTS_TWEET, data: {username, message}});
    res.json({points: usr.points});
  } else {
    res.status(401).send(`A user with the name ${username} does not exist!`);
  }
});

};
