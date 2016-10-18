import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Client from './client.js';
// import './App.css';

class App extends Component {
  render() {

    return (
      <div className="">
        <h2>Disco Match</h2>
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
        /*autoPlay="false"*/
        <audio ref="audio_tag" src="http://localhost:4000/api/song" controls />
      );
    }
  }

export default App;
