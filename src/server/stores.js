const config  = require('../../config.js');
const fs = require('fs');


// GET SONG LIST ++++++++++++++++++++++++++++++++++++

console.log('Calling external python-shrinker...');
const execSync = require('child_process').execSync;
const command = `python shrink.py --duration ${config.TIME_TO_PLAY_S+config.SYNC_PERIOD_S+1} --bitrate ${config.MP3_BITRATE}`
const child = execSync(command, {cwd: __dirname});
console.log(child.toString('utf-8'));


// function sleep(milliseconds) {
//     var start = new Date().getTime();
//     for (var i = 0; i < 1e7; i++) {
//       if ((new Date().getTime() - start) > milliseconds){
//         break;
//       }
//     }
//   }


function shuffle(arr) {
  for (let i = arr.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
  }
  return arr;
}

const SONGS = shuffle(
                fs.readdirSync(config.SONG_FOLDER)
                .filter((fn) => fn.endsWith('.mp3'))
                .map((fn) => fn.slice(0, fn.length - 4))
              );

// SETUP WORK DB ++++++++++++++++++++++++++++++++++++
if (!fs.existsSync(config.DATA_FOLDER)) fs.mkdirSync(config.DATA_FOLDER);
const loki = require('lokijs');
const DB = new loki(config.DATA_FOLDER+'/loki.json', {verbose: false, autosave: true, autosaveInterval: 60000});

const USR = DB.addCollection('Users', {unique: ['username'], indices: ['username']});
const SA = DB.addCollection('SongAllocations',
  {unique: ['code', 'username'], indices: ['username']});
const LOG_SA = DB.addCollection('Log_SA', {indices: ['username']});
const LOG_MATCH = DB.addCollection('Log_Match');
const LOG_TWEET = DB.addCollection('Log_Tweet');


// SAVE TO CSV ++++++++++++++++++++++++++++++++++++
function collectionToCsv(col, dir, sep='|') {
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

function saveStoresToCsv() {
    DB.saveDatabase();
    var csvDir = config.DATA_FOLDER+"/loki_"+(new Date().toISOString().replace(/[-:]/g, ""));
    fs.mkdirSync(csvDir);
    collectionToCsv(USR, csvDir);
    collectionToCsv(LOG_SA, csvDir);
    collectionToCsv(LOG_MATCH, csvDir);
    collectionToCsv(LOG_TWEET, csvDir);

    SONG_COLLECT = {name: 'Songs'}
    SONG_COLLECT.data = SONGS.map((song, idx) => ({song, idx}));
    collectionToCsv(SONG_COLLECT, csvDir);

}



// EXPORT   ++++++++++++++++++++++++++++++++++++

module.exports = {
  USR, SA, LOG_SA, LOG_MATCH, LOG_TWEET, SONGS, saveStoresToCsv
};
