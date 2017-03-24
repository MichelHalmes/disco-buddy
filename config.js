const path = require('path');

const timeToPLay = 15

module.exports = {
	TIME_TO_PLAY_S: timeToPLay,
	TIME_TO_NEXT_S: timeToPLay/3,
	TIME_TO_INACTIVE_S: timeToPLay*1, 
	SYNC_PERIOD_S: timeToPLay/3,
	TARGET_PROBA_MATCH: 0.25,
	POINTS_MATCH: 50,
	POINTS_EMAIL: 25,
	POINTS_SONG_END: 5,
	POINTS_TWEET: 1,
	MAX_NEWS_EVENTS: 15,
	MAX_NAME_LEN: 15,
	MP3_BITRATE: 55,
	SONG_FOLDER: path.join(__dirname, './songs/_shrink'),
	DATA_FOLDER: path.join(__dirname, './data')
}