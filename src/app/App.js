import React from 'react';
import isEmail from 'validator/lib/isEmail';
import Client from './client.js';
import './App.css';

import io from 'socket.io-client';


import { Modal, Popup, Grid} from 'semantic-ui-react'


const App = React.createClass({
  getInitialState: function () {
    let username = JSON.parse(localStorage.getItem('username'));
    return {code: undefined, 
      username: username, 
      points: 0,
      messages: []
    };
  },

  componentDidMount: function () {
    let self = this;
    self.handelCodeRequest();

    self.socket = io();
    self.socket.on('connect', () => self.socket.emit('send:username', self.state.username));
    
    self.socket.on('code:match', function ({username, matchUsername, points}) {
      if (username!== self.state.username) throw new Error('Codematch for another user: ' + username);
      self.pushMessage(`You have matched with ${matchUsername}!`);
      self.setState({points});
      self.handelCodeRequest();
    });
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.username && prevState.username !== this.state.username) {
      this.pushMessage(`Welcome ${this.state.username}!`);
      this.socket.emit('send:username', this.state.username);
    }
    if (prevState.points < this.state.points) {
      this.pushMessage(`Congrats; You have gained ${this.state.points-prevState.points} points! :-)`);
    } else if (prevState.points > this.state.points) {
      this.pushMessage(`Oooh; You have lost ${prevState.points-this.state.points} points! :-(`);
    }
  },

  handleLoginSubmit: function (username, email) {
    let self = this;
    return Client.postLogin(username, email)
      .then(function () {
        self.setState({username});
        localStorage.setItem('username', JSON.stringify(username));
        self.handelCodeRequest();
        return true;
      })
      .catch(function (error) {
        if (error.response.status == 403) { // username already exists!
          return false;
        } else {
           throw error;
        }
      });
  },

  handelCodeRequest: function () {
    let self = this;
    self.setState({code: undefined});
    if (!this.state.username) return Promise.resolve();
    return Client.getCode(this.state.username)
      .then(function(res) {
        self.pushMessage(`New song, new luck...!`);
        self.setState({code: res.code, points: res.points});
      })
      .catch(this.catchLoginError);
  },

  handleCodeSubmit: function (matchCode) {
    let self = this;
    return Client.postMatchCode(this.state.username, matchCode)
      .then(function ({accepted, points, matchUsername}) {
        self.setState({points});
        if (accepted) {
          self.pushMessage(`You have matched with ${matchUsername}!`);
          self.handelCodeRequest();
          return true;
        } else {
          self.pushMessage(`Nope, wrong code!`);
          return false;
        }
      })
  },

  voidMessages: function () {
    this.setState({messages: []})
  },

  pushMessage: function (newMessage) {
    this.setState({messages: this.state.messages.concat([newMessage])});
  },

  catchLoginError: function (error) {
    if (error.response && error.response.status == 401) { // username not found
      this.setState({username: undefined});
      localStorage.removeItem('username')
      return false;
    } else {
       throw error;
    }
  },

  render() {
    return (
      <div className="ui center aligned basic segment" >
        <ModalSetUser username={this.state.username} onLoginSubmit={this.handleLoginSubmit}/>
        <Header />
        <Points username={this.state.username} points={this.state.points}/>
        <Grid centered columns={4}>
          <Grid.Column>
            <AudioPlayer code={this.state.code} pushMessage={this.pushMessage} handelCodeRequest={this.handelCodeRequest}/>
          </Grid.Column>
          <Grid.Column>
            <NextButton onNextClick={this.handelCodeRequest}/>
          </Grid.Column>
        </Grid>
        <CodeArea code={this.state.code} onCodeSubmit={this.handleCodeSubmit}/>
        <MessagePopup messages={this.state.messages} onMessagesRead={this.voidMessages}/>
      </div>
    );
  }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const SECONDS_TO_PLAY = 60;

const AudioPlayer = React.createClass({
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
    if (!this.props.code || this.refs.myAudio.readyState != 4) return;
    let timePlayed = event.nativeEvent.srcElement.currentTime;
    if (timePlayed < SECONDS_TO_PLAY) {
      this.setState({timeRemaining: SECONDS_TO_PLAY - timePlayed});
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
      <div>
        {this.state.timeRemaining == -1 ?
          <i className="big refresh loading icon" ></i> :
          <i className="big play icon" ></i>          
        }
        <div>{secondsToHuman(this.state.timeRemaining)}</div>
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

const CodeArea = React.createClass({

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
    <div className="ui centered grid">
      <div className="ui twelve wide column center aligned raised segment">
        <p>Give your code to a match </p>
        <div className="ui black button">
          <i className="exchange icon"></i> {this.props.code || '????'}
        </div>
        <div className="ui horizontal divider">
          Or
        </div>
        <p>Enter code of match</p>
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

const MessagePopup = React.createClass({
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

const ModalSetUser = React.createClass({
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
    evt.preventDefault();

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
              <p>Promise, we won't spam you or give your email to anyone else. This is only for us to </p>
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

function Points(props) {
  return (
    <div className="ui center aligned basic segment">
      <div className="ui labeled button" tabIndex="0">
        <div className="ui basic blue button">
           {props.username}
        </div>
        <a className="ui basic left pointing blue label">
          {props.points} points
        </a>
      </div>
    </div>  
  );
}



function Header(props) {
  return (
    <div id="main">
      <h2 >
        <i className="music icon"></i> 
        Disco Match 
        <i className="music icon"></i> 
      </h2>
      <p className="side-margins">Find a dancer with your song</p>
      <div className="ui divider"></div>
    </div>  
    );
}

function NextButton(props) {
  return (
    <div>
      <button className="ui labeled icon yellow button" onClick={props.onNextClick}>
        <i className="forward icon"></i>
        Next
      </button>
    </div> 
    );
}

export default App;
