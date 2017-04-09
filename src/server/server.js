const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);

const config  = require('../../config.js');


app.set('port', (process.env.PORT || 4000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./build'));



// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
if (!fs.existsSync(config.DATA_FOLDER)) fs.mkdirSync(config.DATA_FOLDER);
const loki = require('lokijs');
let DB = new loki(config.DATA_FOLDER+'/loki.json', {verbose: false, autosave: true, autosaveInterval: 60000});

let USR = DB.addCollection('Users', {unique: ['username'], indices: ['username']});
let SA = DB.addCollection('SongAllocations',
  {unique: ['code', 'username'], indices: ['username']});
let LOG_SA = DB.addCollection('Log_SA', {indices: ['username']});
let LOG_MATCH = DB.addCollection('Log_Match');



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
  SA.removeWhere((obj) => now - obj.meta.created > config.TIME_TO_PLAY_S * 1000 * 1.25);

  let nbUsers = SA.data.length;
  monitorSocket.emit('send:statistics', {nbUsers: nbUsers});

  let ranking = SA.eqJoin(USR.data, 'username', 'username',
      (left,right) => ({username: right.username, points: right.points}))
    .simplesort('points', true).data();

  monitorSocket.emit('send:ranking', ranking);

}, 4000);


require('./api_routes')(app, USR, SA, LOG_SA, LOG_MATCH, io.sockets, monitorSocket);

// SERVE BUILD ++++++++++++++++++++++++++++++++++++

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../../build', 'index.html'));
});

http.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});


module.exports = http;

// ================================================

collectionToCsv = function(col, dir, sep='|') {
  if (!col.data[0]) return;
  var keys = Object.keys(col.data[0]);
  var result = keys.join(sep) + "\n";

  // Add the rows
  col.data.forEach(function(obj) {
    keys.forEach(function(k, ix) {
        if (ix) result += sep;
        if (k == 'meta') result += new Date(obj[k].created).toISOString();
        else result += obj[k];

    });
    result += "\n";
  });
  fs.writeFileSync(dir+`/${col.name}.csv`, result);
}

process.stdin.resume();//so the program will not close instantly
process.on('SIGINT', function () {
  console.log("Closing...");
  http.close();
  DB.saveDatabase();
  var csvDir = config.DATA_FOLDER+"/loki_"+(new Date().toISOString().replace(/[-:]/g, ""));
  fs.mkdirSync(csvDir);
  collectionToCsv(USR, csvDir);
  collectionToCsv(LOG_SA, csvDir);
  collectionToCsv(LOG_MATCH, csvDir);
  console.log("...done!");
  process.exit();
});
