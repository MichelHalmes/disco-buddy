const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');


const SONG_FOLDER = path.join(__dirname, '../../songs');

const app = express();

app.set('port', (process.env.PORT || 4000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// GET SONG NAME ++++++++++++++++++++++++++++++++++++

const SONGS = fs.readdirSync(SONG_FOLDER)
              .filter((fn) => fn.endsWith('.mp3'))
              .map((fn) => fn.slice(0, fn.length - 4));
              


// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
const loki = require('lokijs');

let DB = new loki('./loki.json');
let SA = DB.addCollection('SongAllocations', {unique: ['code']});
SA.insert({code: '1234', song: 'U2 - Beautiful Day', user: 'michel'});

let USR = DB.addCollection('Users', {unique: ['name']});
USR.insert({username: 'michel', email: ''});


// REST API ++++++++++++++++++++++++++++++++++++

app.post('/api/login', (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  console.log('/api/login', name, email);

  let existingUser = USR.findOne({name});
  if (existingUser) {
    console.log('/api/login', 'Already exists!');
    res.status(403).send('A user with this name exists already!');
  } else {
    USR.insert({name, email});
    console.log('/api/login', 'OK!')
    res.json({});
    res.end();
  }
});


app.get('/api/code', (req, res) => {
  let user = req.body.user
  let code = 1234;
  code = '000' + code.toString();
  code = code.slice(-4);

  let song = SONGS[0]
  SA.insert({code, song, user});
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
  res.json(code);
});


app.get('/api/song/:code', (req, res) => {
  let code = req.params.code;
  let allocation = SA.findOne({code});

  if (allocation) {
    let songFile = allocation.song + '.mp3';
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
    res.sendFile(path.join(SONG_FOLDER, songFile));
  } else {
    res.status(404).send('The requested code does not correspond to any song!');
  }

});





app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
