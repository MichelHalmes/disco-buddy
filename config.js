const path = require('path');


module.exports = {
	TIME_TO_PLAY_S: 1000,
	TIME_TO_NEXT_S: 3,
	TARGET_PROBA_MATCH: 0.25,
	POINTS_MATCH: 50,
	POINTS_EMAIL: 25,
	POINTS_SONG_END: 5,
	POINTS_TWEET: 1,
	SYNC_PERIOD_S: 60,
	MAX_NEWS_EVENTS: 15,
	MAX_NAME_LEN: 15,
	SONG_FOLDER: path.join(__dirname, './songs/shrink')
}