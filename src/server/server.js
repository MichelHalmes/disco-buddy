const bodyParser = require('body-parser');
const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);

const config  = require('../../config.js');


app.set('port', (process.env.PORT || 4000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// STORES ++++++++++++++++++++++++++++++++++++

const USR = require('./stores').USR;
const SA = require('./stores').SA;
const saveStoresToCsv = require('./stores').saveStoresToCsv;


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
  SA.removeWhere((obj) => {
    let must_remove = now - obj.meta.created > config.TIME_TO_PLAY_S * 1000 * 1.25
    if (must_remove) {
      console.log(`Removing ${obj.username}! Inactivity: ${(now-obj.meta.created)/1000} s`)
    }
    return must_remove
  });


  let nbUsers = SA.data.length;
  monitorSocket.emit('send:statistics', {nbUsers: nbUsers});

  let ranking = SA.eqJoin(USR.data, 'username', 'username',
      (left, right) => ({username: right.username, points: right.points}))
    .simplesort('points', true).data();

  monitorSocket.emit('send:ranking', ranking);

}, 4000);

// SERVE ROUTES & BUILD ++++++++++++++++++++++++++++++++++++

require('./api_routes')(app, io.sockets, monitorSocket);

app.use(express.static(path.resolve(__dirname, '../../build')));
app.get('/*', function (req, res) {
  res.sendFile(path.resolve(__dirname, '../../build', 'index.html'));
});

// LAUCH SERVER ++++++++++++++++++++++++++++++++++++

http.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});


module.exports = http;

// ================================================


process.stdin.resume(); // so the program will not close instantly
process.on('SIGINT', function () {
  console.log("Closing...");
  http.close();
  saveStoresToCsv();
  console.log("...done!");
  process.exit();
});
