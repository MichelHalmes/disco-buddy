import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Client from './client.js'
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to Disco Match</h2>
        </div>
        <AudioPlayer />
      </div>
    );
  }
}

class AudioPlayer extends Component {
    // componentDidMount() {
    //   console.info('[AudioPlayer] componentDidMount...');
    //   let elmt = ReactDOM.findDOMNode(this.refs.audio_tag);
    //   console.info('audio prop set', elmt);
    // }

    render() {
      console.info('[AudioPlayer] render...');

      return (
          <audio ref="audio_tag" src="http://localhost:4000/api/song"  autoPlay="true"/>
      );
    }
  }

export default App;
