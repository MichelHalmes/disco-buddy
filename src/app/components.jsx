import React from 'react';
import {Modal, Popup} from 'semantic-ui-react';
import isEmail from 'validator/lib/isEmail';

import Client from './client.js';


const CONFIG  = require('../../config.js');
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export const AudioPlayer = React.createClass({
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
          self.syncTimeOffsetMs = (res.time - new Date().getTime());
        } else { // We get the one with the shortest delay ie maximum offset
          self.syncTimeOffsetMs = Math.max(self.syncTimeOffsetMs, (res.time - new Date().getTime()));
        }
        if (nb_tries<10) {
          setTimeout(self.setSyncTimeOffsetMs.bind(self, nb_tries+1), 2000);
        }  
      });
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (!this.props.code && prevProps.code) { // The song has ended, avoid continuing on buffer
      this.canPause = true;
      this.refs.myAudio.pause()
      this.setState({timePlayed: -1});
    }
  },

  handleClickPlay: function() {
    this.refs.myAudio.play();
    this.props.onActivity();
  },

  handleCanPlayEvent: function() {
    if (this.props.code != this.lastCodeSynced) {
      this.lastCodeSynced = this.props.code;
      this.startTime = (new Date().getTime() + this.syncTimeOffsetMs) /1000 % CONFIG.SYNC_PERIOD_S
      this.refs.myAudio.currentTime = this.startTime;
    }
  },

  handlePlayEvent: function() {
    this.setState({noAutoplay: false});
  },

  handlePauseEvent: function() {
    if (!this.canPause) this.refs.myAudio.play();
    this.canPause = false;
  },


  handleClickNext: function () {
    this.props.onActivity();
    if (this.canClickNext()) {
      this.props.onCodeRequest();
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
      this.props.onCodeRequest();
      this.props.pushMessage(`Time's up!`);
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
              onPause={this.handlePauseEvent}/>

        <div className="column no-margins">
          <div className="ui horizontal segments button no-margins">
            <div className="ui tertiary green inverted center aligned segment no-margins" onClick={this.handleClickPlay}>
              {this.state.timePlayed === -1 ?
                <i className="big refresh loading icon" ></i> :
                <i className="big play icon"></i>
              }
              <p>{renderTimeToPlay(this.state.timePlayed)}</p>
            </div>
            <div className={"ui secondary inverted center aligned segment no-margins " + (this.canClickNext() ? "blue" : "grey")}
              onClick={this.handleClickNext}>
              <i className="big forward icon"></i>
              <p>Next</p>
            </div>
          </div>
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

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export const CodeArea = React.createClass({

  getInitialState() {
    return {matchCode: '', isValid: true};
  },

  onFormSubmit(evt) {
    this.props.onActivity();
    const matchCode = this.state.matchCode;
    const isValid = this.validate(matchCode);
    // evt.preventDefault();

    if (isValid) {
      this.props.onCodeSubmit(matchCode);
      this.setState({matchCode: ''});
    } else {
      this.props.pushMessage(`Bad input!`);
      this.setState({isValid: false});
      setTimeout(this.setState.bind(this, {isValid: true}), 4000);
    }
  },

  onInputChange(evt) {
    this.setState({ matchCode: evt.target.value, isValid: true});
  },

  validate(matchCode) {
    return matchCode && matchCode>=0 && matchCode<=9999;
  },

  render() {
    return (
    <div className="ui centered grid no-margins">
      <div className="ui twelve wide column center aligned raised segment no-margins">
        <div>Give your code to a match </div>
        <div className="ui black button">
          <i className="exchange icon"></i> {this.props.code || '????'}
        </div>
        <div className="ui horizontal divider no-margins">
          Or
        </div>
        <div>Enter code of match</div>
        <div className={"ui left icon action input " + (this.state.isValid ? "" : "error")}>
          <i className="exchange icon"></i>
          <input type="number"
            placeholder="Code"
            value={this.state.matchCode}
            onChange={this.onInputChange}
            style={{maxWidth: '110px'}}
            />
          <button className={"ui green submit button " + (this.props.matchedCurrentCode? "disabled" : "")} onClick={this.onFormSubmit}>Enter</button>
        </div>
      </div>
    </div>
    );
  }
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const timeoutLength = 4000;

export const MessagePopup = React.createClass({
  getInitialState() {
    return { isOpen: false };
  },

  componentDidUpdate: function (prevProps, prevState) {
    // console.log('message')
    if (this.props.messages.length === 0 || prevProps.messages === this.props.messages) return;
    this.setState({isOpen: true})
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.handleClose();

    }, timeoutLength)
  },

  handleClose()  {
    // console.log('close popup')
    this.setState({isOpen: false});
    this.props.onMessagesRead();
    clearTimeout(this.timeout);
  },

  render() {
    return (
      <div className="ui center aligned basic segment">
        <Popup
            content={"undefined"}
            open={this.state.isOpen}
            basic
            on="click"
            onClose={this.handleClose}
            inverted
            flowing>
            {this.props.messages.map((msg, i) => <p key={i}>{msg}</p>)}
        </Popup>
      </div>
    );
  }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export const ModalSetUser = React.createClass({
  getInitialState: function () {
    return {
      fields: {},
      fieldErrors: {}
    };
  },

  onInputChange(evt) {
    const fields = this.state.fields;
    fields[evt.target.name] = evt.target.value;
    this.setState({ fields });
  },

  validate(person) {
    const errors = {};
    let isValid = true;
    if (!person.username) {
      errors.username = 'Name Required';
      isValid = false;
    } else if (person.username.length > CONFIG.MAX_NAME_LEN) {
      errors.username = `Username too long for our screen (max: ${CONFIG.MAX_NAME_LEN})!`;
      isValid = false;
    }
    if (person.email && !isEmail(person.email)) {
      errors.email = 'Invalid Email';
      isValid = false;
    }
    this.setState({fieldErrors: errors});
    return isValid;
  },

  handleFormSubmit(evt) {
    document.getElementById('yourAudioTag').play(); //Force play as autoplay is not allowed on mobile
    let self = this;
    const person = this.state.fields;
    const isValid = this.validate(person);
    // evt.preventDefault();

    if (!isValid) return;

    this.props.onLoginSubmit(person.username, person.email)
      .then(function (isOk){
        if (!isOk) {
          self.setState({
            fields: {},
            fieldErrors: Object.assign({},
              self.state.fieldErrors,
              {nameUnique: 'The username you have chose is already used. Please choose another one!'}
            )
          });
        }
      });
  },

  render: function() {
    return (
      <Modal
        open={!this.props.username}
        closeOnEscape={false}
        closeOnRootNodeClick={false}>
        <div className="ui segment">
          <h1>Enter a username </h1>
          <div className={"ui form " + (Object.keys(this.state.fieldErrors).length ? 'error' : '')}>
            <div className="field">
              <label>Username*</label>
              <input name="username" placeholder="Username" value={this.state.fields.name} onChange={this.onInputChange} />
            </div>
            <div className="field">
              <label>Email address</label>
              <input name="email" placeholder="Email" value={this.state.fields.email} onChange={this.onInputChange}/>
              <p>Promise, we won't spam you or give your email to anyone else. This is only for us to send you pictures and information about the event!</p>
            </div>
            <div className="ui error message " >
              <div className="header">Invalid input</div>
              <ul>
                { Object.keys(this.state.fieldErrors).map((key, i) => <li key={i}>{this.state.fieldErrors[key]}</li>) }
              </ul>
            </div>
            <button className="ui submit button green" onClick={this.handleFormSubmit}>
              Submit
            </button>
          </div>
        </div>
      </Modal>
    );
  },
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export const TweetMessage  = React.createClass({
  getInitialState() {
    return { message: '', isValid: true};
  },

  onFormSubmit(evt) {
    let self = this;
    self.props.onActivity();
    if (self.state.message.length > 3) {
      Client.postTweet(self.props.username, self.state.message)
        .then(function(res) {
          self.props.updatePoints(res.points);
        });
      self.setState({message: '' });
      // evt.preventDefault();
    } else {
      self.props.pushMessage(`Bad input!`);
      self.setState({isValid: false});
      setTimeout(self.setState.bind(self, {isValid: true}), 4000);

    }
  },

  onInputChange(evt) {
    this.setState({message: evt.target.value, isValid: true});
  },

  render() {
    return (
      <div className="ui center aligned basic segment">
        <div className={"ui left icon action input " + (this.state.isValid ? "" : "error")}>
          <i className="talk icon"></i>
          <input type="text"
            placeholder="Message"
            value={this.state.message}
            onChange={this.onInputChange}
            />
          <button className="ui green submit button" onClick={this.onFormSubmit}>Tweet</button>
        </div>
      </div>
    );
  },
})
