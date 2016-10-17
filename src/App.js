import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.svg';
import song from './song.mp3';
import './App.css';

class App extends Component {
  render() {

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to Disco Match</h2>
        </div>
        <audio src={process.env.PUBLIC_URL + '/song.mp3'} controls />
      </div>
    );
  }
}

// class AudioPlayer extends Component {
//     componentDidMount() {
//       console.info('[AudioPlayer] componentDidMount...');
//       let elmt = ReactDOM.findDOMNode(this.refs.audio_tag);
//       console.info('audio prop set', elmt);
//     }

//     render() {
//       console.info('[AudioPlayer] render...');
//       return (
//           <audio ref="audio_tag" src="/static/song.mp3" controls autoPlay="true"/>
//       );
//     }
//   }

export default App;
