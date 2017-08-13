const path = require('path');

const timeToPLay = 90

module.exports = {
	TIME_TO_PLAY_S: 60,
	TIME_TO_NEXT_S: 5,
	TIME_TO_INACTIVE_S: 240,
	SYNC_PERIOD_S: 60,
	TARGET_PROBA_MATCH: 0.25,
	POINTS_MATCH: 50,
	POINTS_EMAIL: 25,
	POINTS_SONG_END: 10,
	POINTS_TWEET: 1,
	MAX_NEWS_EVENTS: 20,
	MAX_NAME_LEN: 15,
	MP3_BITRATE: 55,
	SONG_FOLDER: path.join(__dirname, './songs/_shrink'),
	DATA_FOLDER: path.join(__dirname, './data')
}
