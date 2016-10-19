const express = require('express');
// const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');


const SONG_FOLDER = path.join(__dirname, '../../songs');

const app = express();
app.set('port', (process.env.PORT || 4000));

// GET SONG NAME ++++++++++++++++++++++++++++++++++++

const SONGS = fs.readdirSync(SONG_FOLDER)
              .filter((fn) => fn.endsWith('.mp3'))
              .map((fn) => fn.slice(0, fn.length - 4));
              


// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
const loki = require('lokijs');

let DB = new loki('loki.json');
let SA = DB.addCollection('SongAllocations', {unique: ['code']})
SA.insert({code: '1234', song: 'U2 - Beautiful Day'});


// REST API ++++++++++++++++++++++++++++++++++++


app.get('/api/code', (req, res) => {
  let code = 1234;
  code = '000' + code.toString();
  code = code.slice(-4);

  let song = SONGS[0]
  SA.insert({code, song});

  res.json(code);
});


app.get('/api/song/:code', (req, res) => {
  let code = req.params.code;
  let allocation = SA.findOne({code});

  if (allocation) {
    let songFile = allocation.song + '.mp3';
    res.sendFile(path.join(SONG_FOLDER, songFile));
  } else {
    res.status(404).send('The requested code does not correspond to any song!');
  }

});





app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
