import React from 'react';
import { connect } from 'react-redux';
import { Modal } from 'semantic-ui-react';

import Client from '../client.js';

const CONFIG  = require('../../../config.js');


const AudioPlayer = React.createClass({
  getInitialState: function () {
    this.syncTimeOffsetMs = 0;
    this.startTime = 0;
    this.lastCodeSynced = null;
    this.canPause = false;
    return {timePlayed: -1, noAutoplay: true};
  },

  componentDidMount: function() {
    this.setSyncTimeOffsetMs();
  },

  setSyncTimeOffsetMs: function(nb_tries=0) {
    let self = this;
    return Client.getSyncTime()
      .then(function(res) {
        if (nb_tries==0) {
          self.syncTimeOffsetMs = new Date().getTime() - res.time;
        } else { // We get the one with the shortest delay ever observed
          self.syncTimeOffsetMs = Math.min(self.syncTimeOffsetMs, new Date().getTime() - res.time);
        }
        if (nb_tries<5) {
          setTimeout(self.setSyncTimeOffsetMs.bind(self, nb_tries+1), 15000);
        }
      });
  },

  nextSong: function () {
    this.canPause = true;
    this.refs.myAudio.pause()
    this.props.getCode();
    this.setState({ timePlayed: -1 });
  },

  handleClickPlay: function() {
    this.refs.myAudio.play();
    this.props.onActivity();
  },

  handleCanPlayEvent: function() {
    if (this.props.code != this.lastCodeSynced) {
      this.lastCodeSynced = this.props.code;
      this.startTime = (new Date().getTime() - this.syncTimeOffsetMs) /1000 % CONFIG.SYNC_PERIOD_S
      this.refs.myAudio.currentTime = this.startTime;
    }
  },

  handlePlayEvent: function() {
    this.setState({noAutoplay: false});
  },

  handlePauseEvent: function() {
    if (!this.canPause) {
      this.refs.myAudio.play()
        .catch(() => {}) // If pause might conflict wit this...
    };
    this.canPause = false;
  },

  handleEndedEvent: function () {
    // Should not happen if songs are long enough...
    this.nextSong();
  },

  handleClickNext: function () {
    this.props.recordActivity();
    if (this.canClickNext()) {
      this.nextSong();
    } else {
      this.props.pushMessage(`Play longer to click next!`);
    }
  },

  canClickNext: function () {
    return this.state.timePlayed > CONFIG.TIME_TO_NEXT_S || this.props.matchedCurrentCode;
  },

  handleTimeUpdate: function (event){
    // eslint-disable-next-line
    if (!this.props.code || this.refs.myAudio.readyState != 4) return;
    let timePlayed = event.nativeEvent.srcElement.currentTime - this.startTime;
    if (timePlayed < CONFIG.TIME_TO_PLAY_S) {
      this.setState({timePlayed: timePlayed});
    } else {
      this.props.pushMessage(`Time's up!`);
      this.nextSong();
    }
  },

  render() {
    function renderTimeToPlay(timePlayed) {
      if (timePlayed < 0) return '--:--';
      let timeRemaining = CONFIG.TIME_TO_PLAY_S - timePlayed ;
      return [
        pad(Math.floor(timeRemaining / 60).toString(), 2),
        pad(Math.floor(timeRemaining % 60).toString(), 2),
      ].join(':');
    }

    function pad(numberString, size) {
      let padded = numberString;
      while (padded.length < size) padded = `0${padded}`;
      return padded;
    }

    return (
      <div className="ui two column centered grid no-margins">
        <audio id="yourAudioTag" ref="myAudio" autoPlay={true}
              src={this.props.code && "/api/song/" + this.props.code}
              onTimeUpdate={this.handleTimeUpdate}
              onCanPlay={this.handleCanPlayEvent}
              onPlay={this.handlePlayEvent}
              onPause={this.handlePauseEvent}
              onEnded={this.handleEndedEvent}/>

        <div className="ui buttons no-margins ">
          <button className="ui basic button blue no-margins " onClick={this.handleClickPlay}>
            {this.state.timePlayed === -1 ?
              <i className="big refresh loading icon icon-margin" ></i> :
              <i className="big play icon icon-margin"></i>
            }
            <p>{renderTimeToPlay(this.state.timePlayed)}</p>
          </button>
          <button className={"ui blue button no-margins " + (this.canClickNext() ? "" : "basic disabled")}
              onClick={this.handleClickNext}>
              <i className="big forward icon icon-margin"></i>
              <p>Next</p>
          </button>

        </div>


        <Modal open={this.state.noAutoplay && !!this.props.code} >
          <div className="ui center aligned basic segment">
            <h1>You are good to go!</h1>
            <button className="ui submit button green" onClick={this.handleClickPlay}>
              Play music!
            </button>
          </div>
        </Modal>
      </div>
    );
  },
});


const mapStateToProps = state => {
  return {
    code: state.codeReducer.code,
    matchedCurrentCode: state.codeReducer.matchedCurrentCode
  }
}

import { getCodeAC, pushMessageAC, recordActivityAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getCode: () => dispatch(getCodeAC()),
    pushMessage: (message) => dispatch(pushMessageAC(message)),
    recordActivity: () => dispatch(recordActivityAC())
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(AudioPlayer);
