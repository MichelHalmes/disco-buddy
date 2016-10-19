import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Client from './client.js';
import Helper from './helper.js';
import './App.css';

class App extends Component {
  render() {

    return (
      <div className="ui centered" >
        <Header />
        <CodeArea code="1234"/>
        <AudioPlayer />
        <NextButton />
      </div>
    );
  }
}


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


class AudioPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {timeRemaining: 120};
  }

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
  }
}

export default App;
