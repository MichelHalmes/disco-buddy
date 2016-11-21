const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');


const SONG_FOLDER = path.join(__dirname, '../../songs');

const express = require('express');
const app = express();
const http = require('http').Server(app);

app.set('port', (process.env.PORT || 4000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// GET SONG NAME ++++++++++++++++++++++++++++++++++++
function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}

const SONGS = shuffle(
                fs.readdirSync(SONG_FOLDER)
                .filter((fn) => fn.endsWith('.mp3'))
                .map((fn) => fn.slice(0, fn.length - 4))
              );

              


// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
const loki = require('lokijs');
let DB = new loki('./loki.json');

let SA = DB.addCollection('SongAllocations', {unique: ['code', 'username']});
let LOG = DB.addCollection('Logs');
let USR = DB.addCollection('Users', {unique: ['username']});


// POST LOGIN ++++++++++++++++++++++++++++++++++++"

app.post('/api/login', (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  console.log('/api/login', username, email);

  let existingUser = USR.findOne({username});
  if (existingUser) {
    console.log('/api/login', 'Already exists!');
    res.status(403).send('A user with this username exists already!');
  } else {
    USR.insert({username, email, points: 0});
    console.log('/api/login', 'OK!')
    res.json({});
  }
});


// GET CODE ++++++++++++++++++++++++++++++++++++
let nextCode = 1;
let nextSongIdx = 0;
const MIN_PROBA_MATCH = 0.5;

// USR.insert({username: 'michel', email: '', points: 0, socketId: undefined});
// USR.insert({username: 'a', email: '', points: 0});
// USR.insert({username: 'b', email: '', points: 0});
// USR.insert({username: 'c', email: '', points: 0});

// // LOG.insert({username: 'michel', songIdx: '0'});
// // LOG.insert({username: 'michel', songIdx: '0'});
// SA.insert({code: '0000', songIdx: 0, username: 'a'});
// SA.insert({code: '0001', songIdx: 0, username: 'b'});
// SA.insert({code: '0002', songIdx: 0, username: 'c'});
// SA.insert({code: '0003', songIdx: 1, username: 'd'});
// nextCode = 4;
// nextSongIdx = 2;

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }


app.get('/api/code', (req, res) => {
  console.log('/api/code');
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

  let songsPlayed = SA.find({}).map((sa) => sa.songIdx);
  let songCounts = {};
  songsPlayed.forEach(function (songIdx) {
    songCounts[songIdx] = songCounts[songIdx] ? songCounts[songIdx]+1 : 1;
  });

  let songIdxUser = LOG.find({username}).map((log) => log.songIdx);

  let songIdxBest; 
  Object.keys(songCounts).forEach(function (songIdx) {
    songIdx = parseInt(songIdx)
    if ((songIdxBest == undefined || songCounts[songIdx] < songCounts[songIdxBest]) 
      && songIdxUser.indexOf(songIdx) == -1) {
        songIdxBest = songIdx;
    }
  });

  let nbPlayers = songsPlayed.length;
  if (songIdxBest == undefined) { // The player has heard everything
    let lastSongUser = songIdxUser.length ? Math.max(... songIdxUser): -1;
    songIdxBest = (lastSongUser + 1) % SONGS.length;; 
  } else if (nbPlayers != 1 && (songCounts[songIdxBest]-1) / (nbPlayers - 1) > MIN_PROBA_MATCH) { // There are too many players per song. We need to add songs
    songIdxBest = nextSongIdx;
    nextSongIdx = (nextSongIdx + 1) % SONGS.length; 
  }
  
  let previousAllocation = SA.findOne({username});
  if (previousAllocation) {
    SA.remove(previousAllocation);
    usr.points -= 5;
    USR.update(usr);
  }
  SA.insert({code, songIdx: songIdxBest, username});
  LOG.insert({songIdx: songIdxBest, username});
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
  res.json({code, points: usr.points});

  console.log(`Code ${code} for ${username}; playing: ${SONGS[songIdxBest]}`);
});


// GET SONG ++++++++++++++++++++++++++++++++++++

app.get('/api/song/:code', (req, res) => {
  let code = req.params.code;
  let allocation = SA.findOne({code});

  if (allocation) {
    let songFile = SONGS[allocation.songIdx] + '.mp3';
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
    res.sendFile(path.join(SONG_FOLDER, songFile));
  } else {
    res.status(404).send('The requested code does not correspond to any song!');
  }

});

// POST MACTHCODE ++++++++++++++++++++++++++++++++++++

const io = require('socket.io')(http);

io.on('connection', function (socket) {
  console.log('connection', socket.id); 
  socket.on('send:username', function (username) {
    console.log('send:username', username);
    USR.findAndUpdate(
      (usr) => usr.username === username,
      (usr) => usr.socketId = socket.id
    );
  });

  socket.on('disconnect', function() {
    console.log('connection-disconnect', socket.id);

    USR.findAndUpdate(
      (usr) => usr.socketId === socket.id,
      (usr) => usr.socketId = undefined
    );
  });
});


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
    
    usrUser.points += 50;
    USR.update(usrUser);

    let usrMatch = USR.findOne({username: saMatch.username});
    usrMatch.points += 50;
    USR.update(usrMatch);

    console.log('/api/matchcode', 'It is a match!');
    res.json({accepted: true, points: usrUser.points, matchUsername: usrMatch.username});

    let matchSocket = io.sockets.connected[usrMatch.socketId]
    if (matchSocket) {
      matchSocket.emit('code:match', 
        {username: usrMatch.username, matchUsername: usrUser.username, points: usrMatch.points}
      );
    } else {
      console.log('No socket found for :' + usrMatch.username);
    }
  } else {
    console.log('/api/matchcode', 'Nope, keep trying!');
    res.json({accepted: false, points: usrUser.points});
  }
});



// ================================================

process.on('SIGTERM', function () {
  console.log("Closing");
  DB.saveDatabase();
  app.close();
});

http.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
