const path = require('path');
const fs = require('fs');

const config  = require('../../config.js');


console.log('Calling external python-shrinker...');
let shrinkIsDone = false;
const execSync = require('child_process').execSync;
const command = `python shrink.py --duration ${config.TIME_TO_PLAY_S+config.SYNC_PERIOD_S+1} --bitrate ${config.MP3_BITRATE}`
let child = execSync(command, {cwd: __dirname});
console.log(child.toString('utf-8'));


// function sleep(milliseconds) {
//     var start = new Date().getTime();
//     for (var i = 0; i < 1e7; i++) {
//       if ((new Date().getTime() - start) > milliseconds){
//         break;
//       }
//     }
//   }



function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}



const SONGS = shuffle(
                fs.readdirSync(config.SONG_FOLDER)
                .filter((fn) => fn.endsWith('.mp3'))
                .map((fn) => fn.slice(0, fn.length - 4))
              );



module.exports = function(app, USR, SA, LOG, matchSockets, monitorSocket) {

// POST LOGIN ++++++++++++++++++++++++++++++++++++

app.post('/api/login', (req, res) => {
  let username = req.body.username;
  let email = req.body.email;

  let existingUser = USR.findOne({username});
  if (existingUser) {
    res.status(403).send('A user with this username exists already!');
  } else {
    let points = email ? config.POINTS_EMAIL : 0
    USR.insert({username, email, points});
    res.json({points});
    monitorSocket.emit('send:newsEvent', {type: 'login', points, data: {username}});
  }
});

    // GET CODE ++++++++++++++++++++++++++++++++++++
let nextCode = 1;
let nextSongIdx = 0;

// USR.insert({username: 'The Player', email: '', points: 9, socketId: undefined});
// USR.insert({username: 'Mary', email: '', points: 10});
// USR.insert({username: 'Kate', email: '', points: 30});
// USR.insert({username: 'Peter', email: '', points: -5});
// USR.insert({username: 'John', email: '', points: 20});
//
// // LOG.insert({username: 'michel', songIdx: '0'});
// // LOG.insert({username: 'michel', songIdx: '0'});
// SA.insert({code: '0000', songIdx: 1, username: 'Mary'});
// SA.insert({code: '0001', songIdx: 0, username: 'Kate'});
// SA.insert({code: '0002', songIdx: 0, username: 'Peter'});
// SA.insert({code: '0003', songIdx: 0, username: 'John'});
// nextCode = 4;
// nextSongIdx = 2;








app.get('/api/code', (req, res) => {
  console.time('NewCode');
  let username = Buffer.from(req.headers.authorization, 'base64').toString();

  let usr = USR.findOne({username});
  if (!usr) {
    console.log('Could not find user :' + username);
    res.status(401).send(`A user with the name ${username} does not exist!`);
    return;
  }

  let code = nextCode;
  nextCode = (nextCode+1) % 10000;
  code = '000' + code.toString();
  code = code.slice(-4);

  let saSongIdxAll = SA.find({}).map((sa) => sa.songIdx);
  let songCounts = {};
  saSongIdxAll.forEach(function (songIdx) {
    songCounts[songIdx] = songCounts[songIdx] ? songCounts[songIdx]+1 : 1;
  });

  let logSongIdxUser = LOG.find({username}).map((log) => log.songIdx);

  let songIdxBest;
  Object.keys(songCounts).forEach(function (songIdx) {
    songIdx = parseInt(songIdx)
    if ((songIdxBest == undefined || songCounts[songIdx] < songCounts[songIdxBest])
      && logSongIdxUser.indexOf(songIdx) == -1) {
        songIdxBest = songIdx;
    }
  });


  let nbUsers = saSongIdxAll.length;
  if (songIdxBest == undefined) { // The player has heard everything
    console.log(`${username} has heard everything!`);
    console.log('songCount', songCounts);
    console.log('logSongIdxUser', logSongIdxUser);
    let lastSongUser = logSongIdxUser.length ? Math.max(... logSongIdxUser): -1;
    songIdxBest = (lastSongUser + 1) % SONGS.length;
  } else if (nbUsers != 1 && (songCounts[songIdxBest]-1) / (nbUsers - 1) > config.TARGET_PROBA_MATCH) { // There are too many players per song. We need to add songs
    songIdxBest = nextSongIdx;
    nextSongIdx = (nextSongIdx + 1) % SONGS.length;
  }

  let previousAllocation = SA.findOne({username});
  if (previousAllocation) {
    let songDuration = (Date.now() - previousAllocation.meta.created) / 1000;
    if (songDuration > 0.95 * config.TIME_TO_PLAY_S && songDuration < 1.25 * config.TIME_TO_PLAY_S) { // End of song without inactivity
      usr.points += config.POINTS_SONG_END;
      USR.update(usr);
    }
    SA.remove(previousAllocation);
  } else { // This is a new user, that was not yet in SA
    nbUsers += 1;
  }
  SA.insert({code, songIdx: songIdxBest, username});
  LOG.insert({songIdx: songIdxBest, username});
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({code, points: usr.points});

  console.log(`Code ${code} for ${username}; playing: ${SONGS[songIdxBest]}`);

  monitorSocket.emit('send:statistics', {nbUsers, nbSongs: Object.keys(songCounts).length});
  console.timeEnd('NewCode');
});


// GET SONG ++++++++++++++++++++++++++++++++++++

app.get('/api/song/:code', (req, res) => {
  let code = req.params.code;
  let allocation = SA.findOne({code});

  if (allocation) {
    let songFile = SONGS[allocation.songIdx] + '.mp3';
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

// POST MACTHCODE ++++++++++++++++++++++++++++++++++++


app.post('/api/matchcode', (req, res) => {
  let username = req.body.username;
  let matchCode = req.body.matchCode;
  console.log('/api/matchcode', username, matchCode);

  let usrUser = USR.findOne({username});
  if (!usrUser) {
    res.status(401).send(`A user with the name ${username} does not exist!`);
    return;
  }

  matchCode = '000' + matchCode.toString();
  matchCode = matchCode.slice(-4);
  let saMatch = SA.findOne({code: matchCode});
  let saUser = SA.findOne({username});

  if (saUser && saMatch && saUser.songIdx == saMatch.songIdx) {
    SA.remove(saUser);
    SA.remove(saMatch);

    usrUser.points += config.POINTS_MATCH;
    USR.update(usrUser);

    let usrMatch = USR.findOne({username: saMatch.username});
    usrMatch.points += config.POINTS_MATCH;
    USR.update(usrMatch);

    res.json({accepted: true, points: usrUser.points, matchUsername: usrMatch.username});

    let matchSocket = matchSockets.connected[usrMatch.socketId]
    if (matchSocket) {
      matchSocket.emit('code:match',
        {username: usrMatch.username, matchUsername: usrUser.username, points: usrMatch.points}
      );
    } else {
      console.log('No socket found for :' + usrMatch.username);
    }

    monitorSocket.emit('send:newsEvent', {type: 'match', points: config.POINTS_MATCH, data:
      {username, matchUsername: usrMatch.username, song: SONGS[saUser.songIdx]}});

  } else {
    res.json({accepted: false, points: usrUser.points});
  }
});

// POST LOGIN ++++++++++++++++++++++++++++++++++++"

app.post('/api/tweet', (req, res) => {
  let username = req.body.username;
  let message = req.body.message;


  let usr = USR.findOne({username});
  if (usr) {
    usr.points += config.POINTS_TWEET;
    USR.update(usr);
    monitorSocket.emit('send:newsEvent', {type: 'message', points: config.POINTS_TWEET, data: {username, message}});
  } else {
    res.status(401).send(`A user with the name ${username} does not exist!`);
  }
});

};
