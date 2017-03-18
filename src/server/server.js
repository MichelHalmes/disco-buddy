const bodyParser = require('body-parser');

const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);

const CONFIG  = require('../../config.js');


app.set('port', (process.env.PORT || 4000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./build'));



// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
const loki = require('lokijs');
let DB = new loki('./loki.json', {verbose: false, autosave: true, autosaveInterval: 60000});

let USR = DB.addCollection('Users', {unique: ['username'], indices: ['username']});
let SA = DB.addCollection('SongAllocations', 
  {unique: ['code', 'username'], indices: ['username']});
let LOG = DB.addCollection('Logs', {indices: ['username']});



// SOCKETS ++++++++++++++++++++++++++++++++++++
const io = require('socket.io')(http);

io.on('connection', function (socket) {
  socket.on('send:username', function (username) {
    USR.findAndUpdate(
      (usr) => usr.username === username,
      (usr) => usr.socketId = socket.id
    );
  });

  socket.on('disconnect', function() {
    USR.findAndUpdate(
      (usr) => usr.socketId === socket.id,
      (usr) => usr.socketId = undefined
    );
  });
});

let monitorSocket = io.of('/monitor');

setInterval(function () {
  let now = Date.now();
  SA.removeWhere((obj) => now - obj.meta.created > CONFIG.SECONDS_TO_PLAY * 1000 * 1.5);

  let nbUsers = SA.data.length;
  monitorSocket.emit('send:statistics', {nbUsers: nbUsers});

  let ranking = SA.eqJoin(USR.data, 'username', 'username', 
      (left,right) => ({username: right.username, points: right.points}))
    .simplesort('points', true).data();

  monitorSocket.emit('send:ranking', ranking);

}, 4000);

// SERVE BUILD ++++++++++++++++++++++++++++++++++++

// app.get('/', function (req, res) {
//   res.sendFile(path.join(__dirname, './build', 'index.html'));
// });


require('./api_routes')(app, USR, SA, LOG, monitorSocket);

http.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});



// ================================================

process.on('SIGTERM', function () {
  console.log("Closing");
  DB.saveDatabase();
  app.close();
});

module.exports = http;


