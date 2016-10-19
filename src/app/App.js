import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Client from './client.js';
import Helper from './helper.js';
import './App.css';

import { Modal, Button, Icon } from 'semantic-ui-react'


const App = React.createClass({
  getInitialState: function () {
    let user = JSON.parse(localStorage.getItem('user'));
      // localStorage.setItem('user', JSON.stringify(this.state));
    return {code: undefined, user: user};
  },

  render() {
    return (
      <div className="ui centered" >
        <Header />
        <CodeArea code="1234"/>
        <AudioPlayer />
        <NextButton />
        <ModalSetUser user=""/>
      </div>
    );
  }
});


const ModalSetUser = React.createClass({

  // close  () { 
  //   this.setState({ open: false })
  // }

  handleSubmit: function () {
    let user = this.refs.user.value;
    let email = this.refs.email.value;
    console.log(user, email, 'ekeje');
  },

  render: function() {

    return (
      <Modal
        open={!this.props.user}
        closeOnEscape={false}
        closeOnRootNodeClick={false}
        onClose={this.close}>
        <div className="ui segment">
          <h1>Enter a username </h1>
          <form className="ui form">
            <div className="field">
              <label>Username*</label>
              <input type="text" ref="user" placeholder="Username" required/>
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" ref="email" placeholder="Email"/>
            </div>
            <button className="ui button green" onClick={this.handleSubmit}>Submit</button>
          </form>
        </div>
      </Modal>
    );
  },
});




function Header(props) {
  return (
    <div id="main" className="ui center aligned basic segment">
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

function CodeArea(props) {
  return (
    <div className="ui centered grid">
      <div className="ui twelve wide column center aligned raised segment">
        <p>Give your code to a match </p>
        <div className="ui black button">
          <i className="exchange icon"></i> {props.code}
        </div>
        <div className="ui horizontal divider">
          Or
        </div>
        <p>Enter code of match</p>
        <div className="ui left icon mini action input">
          <i className="exchange icon"></i>
          <input type="text" placeholder="Code"/>
          <div className="ui green submit button">Enter</div>
        </div>
      </div>
    </div>
    );
}

function NextButton() {
  return (
    <div className="ui center aligned basic segment">
      <button className="ui labeled icon yellow button">
        <i className="forward icon"></i>
        Next
      </button>
    </div> 
    );
}



const AudioPlayer = React.createClass({
  getInitialState: function () {
    return {timeRemaining: 120};
  },

  render() {
    let self = this;
    function updateTrackTime(event){
      let timePlayed = event.nativeEvent.srcElement.currentTime;
      self.setState({timeRemaining: 120 - timePlayed});
    }

     /*autoPlay="false"*/
    return (
      <div className="ui center aligned basic segment">
        <i className="big play icon" ></i>
        <i className="big refresh loading icon" ></i>
        <div>{Helper.secondsToHuman(this.state.timeRemaining)}</div>
        <audio ref="audio_tag" src="http://localhost:4000/api/song"  onTimeUpdate={updateTrackTime}/>
      </div>   
    );
  },
});

export default App;
