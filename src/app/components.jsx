import React from 'react';
import { Modal, Popup} from 'semantic-ui-react';
import isEmail from 'validator/lib/isEmail';

import Client from './client.js';


const CONFIG  = require('../../config.json');
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export const AudioPlayer = React.createClass({
  getInitialState: function () {
    return {timeRemaining: -1, noAutoplay: true};
  },

  playMusic: function () {
    this.refs.myAudio.play();
  },

  handlePlay: function () {
    this.setState({noAutoplay: false});
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (!this.props.code && prevProps.code) {
      this.setState({timeRemaining: -1});
    }
  },

  updateTrackTime: function (event){
    // eslint-disable-next-line
    if (!this.props.code || this.refs.myAudio.readyState != 4) return;
    let timePlayed = event.nativeEvent.srcElement.currentTime;
    if (timePlayed < CONFIG.SECONDS_TO_PLAY) {
      this.setState({timeRemaining: CONFIG.SECONDS_TO_PLAY - timePlayed});
    } else {
      this.props.handelCodeRequest();
      this.props.pushMessage(`Time's up!`);        
    } 
  },

  render() {
    function secondsToHuman(time) {
      if (time < 0) return '--:--';
      return [
        pad(Math.floor(time / 60).toString(), 2),
        pad(Math.floor(time % 60).toString(), 2),
      ].join(':');
    }

    function pad(numberString, size) {
      let padded = numberString;
      while (padded.length < size) padded = `0${padded}`;
      return padded;
    }

    return (
      <div className="ui two column centered grid no-margins">
        <div className="column no-margins">
          <div className="ui horizontal segments no-margins">
            <div className="ui tertiary green inverted center aligned segment no-margins" onClick={this.playMusic}>
              {this.state.timeRemaining === -1 ?
                <i className="big refresh loading icon" ></i> :
                <i className="big play icon" ></i>          
              }
              <p>{secondsToHuman(this.state.timeRemaining)}</p>
            </div>
            <div className="ui secondary red inverted center aligned segment no-margins" onClick={this.props.handelCodeRequest}>
              <i className="big forward icon"></i>
              <p>Next</p>
            </div>
          </div>
        </div>
         <audio id="yourAudioTag" ref="myAudio" autoPlay={true}
              src={this.props.code && "/api/song/" + this.props.code} 
              onTimeUpdate={this.updateTrackTime}
              onPlay={this.handlePlay}/>
        <Modal open={this.state.noAutoplay && !!this.props.code} >
          <div className="ui center aligned basic segment">
            <h1>You are good to go!</h1>
            <button className="ui submit button green" onClick={this.playMusic}>
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
    return {matchCode: '', isValid: false};
  },

  onFormSubmit(evt) {
    const matchCode = this.state.matchCode;
    const isValid = this.validate(matchCode);
    this.setState({isValid});
    // evt.preventDefault();

    if (!isValid) return;

    this.props.onCodeSubmit(matchCode);
    this.setState({ matchCode: ''});
  },

  onInputChange(evt) {
    this.setState({ matchCode: evt.target.value });
  },

  validate(matchCode) {
    parseInt(matchCode, 10);
    return true;
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
        <div className="ui left icon action input">
          <i className="exchange icon"></i>
          <input type="number" 
            placeholder="Code" 
            value={this.state.matchCode} 
            onChange={this.onInputChange} 
            style={{maxWidth: '100px'}}
            />
          <button className="ui green submit button" onClick={this.onFormSubmit}>Enter</button>
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
    if (this.props.messages.length === 0 || prevProps.messages === this.props.messages) return;
    this.setState({isOpen: true})

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.handleClose();

    }, timeoutLength)
  },

  handleClose()  {
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
            flowing
          >
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
    if (!person.username) errors.username = 'Name Required';
    if (person.email && !isEmail(person.email)) errors.email = 'Invalid Email';
    return errors;
  },

  handleFormSubmit(evt) {
    let self = this;
    const person = this.state.fields;
    const fieldErrors = this.validate(person);
    this.setState({ fieldErrors });
    // evt.preventDefault();

    document.getElementById('yourAudioTag').play();

    if (Object.keys(fieldErrors).length) return;

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


export const TweetMessage  = React.createClass({
  getInitialState() {
    return { message: ''};
  },

  onFormSubmit(evt) {
    Client.postMessage(this.props.username, this.state.message);
    this.setState({ message: '' });
    // evt.preventDefault();
  },

  onInputChange(evt) {
    this.setState({ message: evt.target.value });
  },

  render() {
    return (
      <div className="ui center aligned basic segment">
        <div className="ui left icon action input">
          <i className="comment icon"></i>
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




