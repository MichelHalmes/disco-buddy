import React from 'react';

import io from 'socket.io-client';
import {Modal} from 'semantic-ui-react';


import Client from './client.js';
import {AudioPlayer, CodeArea, MessagePopup, ModalSetUser, TweetMessage} from './components.jsx';
import './App.css';
import CONFIG from '../../config.js';




const App = React.createClass({
  getInitialState: function () {
    let username = JSON.parse(localStorage.getItem('username'));
    this.lastActivity = new Date().getTime();
    this.resolveInactivity;

    return {code: undefined, 
      username: username, 
      points: 0,
      messages: [],
      matchedCurrentCode: false,
      isInactive: false
    };
  },

  componentDidMount: function () {
    let self = this; 
    self.handelCodeRequest();

    self.socket = io();
    self.socket.on('connect', () => self.socket.emit('send:username', self.state.username));
    
    self.socket.on('code:match', function ({username, matchUsername, points}) {
      if (username!== self.state.username) throw new Error('Codematch for another user: ' + username);
      self.setState({points, matchedCurrentCode: true, 
        messages: self.state.messages.concat([`You have matched with ${matchUsername}!`, `Click 'Next' for a new song!`]) });
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
    username = username.trim();
    return Client.postLogin(username, email)
      .then(function (res) {
        self.setState({username, points: res.points});
        localStorage.setItem('username', JSON.stringify(username));
        self.handelCodeRequest();
        return true;
      })
      .catch(function (error) {
        // eslint-disable-next-line
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
    if (!self.state.username) return Promise.resolve(); // After Login error

    return new Promise(function(resolve) { 
      if (new Date().getTime() - self.lastActivity < CONFIG.TIME_TO_INACTIVE_S * 1000) {
        resolve();
      } else {
        self.setState({isInactive: true});
        self.resolveInactivity = resolve;
      }})
      .then(() => Client.getCode(self.state.username))
      .then(function(res) {
        self.pushMessage(`New song, new luck...!`);
        self.setState({code: res.code, points: res.points, matchedCurrentCode: false});
      })
      .catch(self.catchLoginError);
  },

  catchLoginError: function (error) {
    // eslint-disable-next-line
    if (error.response && error.response.status == 401) { // username not found
      this.setState({username: undefined});
      localStorage.removeItem('username')
      return false;
    } else {
       throw error;
    }
  },

  handleCodeSubmit: function (matchCode) {
    let self = this;
    return Client.postMatchCode(this.state.username, matchCode)
      .then(function ({accepted, points, matchUsername}) {
        if (accepted) {
          self.setState({points, matchedCurrentCode: true,
            messages: self.state.messages.concat([`You have matched with ${matchUsername}!`, `Click 'Next' for a new song!`]) });
          return true;
        } else {
          self.setState({points, messages: self.state.messages.concat([`Nope, wrong code!`]) });
          return false;
        }
      })
  },

  handleReactivate: function () {
    this.resolveInactivity();
    this.recordActivity();
    this.setState({isInactive: false});
  },  

  recordActivity: function () {
    this.lastActivity = new Date().getTime();
  },

  voidMessages: function () {
    this.setState({messages: []})
  },

  pushMessage: function (newMessage) {
    this.setState({messages: this.state.messages.concat([newMessage])});
  },

  updatePoints: function (points) {
    this.setState({points});
  },




  render() {
    return (
      <div className="ui center aligned basic segment no-margins" >
        
        <Header />
        <Points username={this.state.username} points={this.state.points}/>
        <AudioPlayer code={this.state.code} matchedCurrentCode={this.state.matchedCurrentCode} 
              onCodeRequest={this.handelCodeRequest} pushMessage={this.pushMessage} 
              onActivity={this.recordActivity} />
        <CodeArea code={this.state.code} onCodeSubmit={this.handleCodeSubmit} 
              matchedCurrentCode={this.state.matchedCurrentCode}
              pushMessage={this.pushMessage} onActivity={this.recordActivity}/>
        <TweetMessage username={this.state.username} pushMessage={this.pushMessage} 
              updatePoints={this.updatePoints} onActivity={this.recordActivity}/>
        <ModalSetUser username={this.state.username} onLoginSubmit={this.handleLoginSubmit} />
        <ModalInactivity isInactive={this.state.isInactive} onReactivate={this.handleReactivate} />
        <MessagePopup messages={this.state.messages} onMessagesRead={this.voidMessages} />
      </div>
    );
  }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function Points(props) {
  return (
    <div className="ui center aligned basic segment no-margins">
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
    <div >
      <h2 className="no-margins">
        <i className="music icon"></i> 
        Disco Match 
        <i className="music icon"></i> 
      </h2>
      <div className="">Find a dancer with your song!</div>
      <div className="ui divider no-margins"></div>
    </div>  
  );
}

function ModalInactivity(props) {
  return (
    <Modal open={props.isInactive} >
      <div className="ui center aligned basic segment">
        <h1>You have been inactive for quite some time...?</h1>
        <button className="ui submit button green" onClick={props.onReactivate}>
          Continue playing!
        </button>
      </div>
    </Modal>  
  );
}



export default App;
