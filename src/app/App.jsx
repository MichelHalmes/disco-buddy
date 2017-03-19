import React from 'react';

import io from 'socket.io-client';
import { Modal, Popup} from 'semantic-ui-react';


import Client from './client.js';
import {AudioPlayer, CodeArea, MessagePopup, ModalSetUser, TweetMessage} from './components.jsx';
import './App.css';




const App = React.createClass({
  getInitialState: function () {
    let username = JSON.parse(localStorage.getItem('username'));
    return {code: undefined, 
      username: username, 
      points: 0,
      messages: ["Welcome!"],
      matchedCurrent: false
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
    // eslint-disable-next-line
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
      <div className="ui center aligned basic segment no-margins" >
        <ModalSetUser username={this.state.username} onLoginSubmit={this.handleLoginSubmit}/>
        <Header />
        <Points username={this.state.username} points={this.state.points}/>
        <AudioPlayer code={this.state.code} pushMessage={this.pushMessage} onCodeRequest={this.handelCodeRequest}/>
        <CodeArea code={this.state.code} onCodeSubmit={this.handleCodeSubmit}/>
        <TweetMessage username={this.state.username}/>
        <MessagePopup messages={this.state.messages} onMessagesRead={this.voidMessages}/>
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
      <div className="">Find a dancer with your song</div>
      <div className="ui divider no-margins"></div>
    </div>  
    );
}



export default App;
