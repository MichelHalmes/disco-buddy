const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

const SONG_FOLDER = path.join(__dirname, 'songs');

app.set('port', (process.env.PORT || 4000));

// app.use('/', express.static(path.join(__dirname, 'public')));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));



app.get('/api/song', (req, res) => {
  res.sendFile(path.join(SONG_FOLDER, 'song.mp3'));
});


app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
