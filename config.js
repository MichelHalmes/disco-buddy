const path = require('path');

const syncPeriod = 40
const timeToPLay = 3 * syncPeriod

module.exports = {
	TIME_TO_PLAY_S: timeToPLay,
	TIME_TO_NEXT_S: 20,
	TIME_TO_INACTIVE_S: timeToPLay * 4 + 20,
	SYNC_PERIOD_S: syncPeriod,
	TARGET_PROBA_MATCH: 0.2,
	POINTS_MATCH: 50,
	POINTS_EMAIL: 100,
	POINTS_SONG_END: 10,
	POINTS_TWEET: 5,
	MAX_NEWS_EVENTS: 20,
	MAX_NAME_LEN: 15,
	MP3_BITRATE: 55,
	SONG_FOLDER: path.join(__dirname, './songs/_shrink'),
	DATA_FOLDER: path.join(__dirname, './data')
}
