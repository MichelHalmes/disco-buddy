import React from 'react';
import isEmail from 'validator/lib/isEmail';
import Client from './client.js';
import Helper from './helper.js';
import './App.css';

import { Modal} from 'semantic-ui-react'


const App = React.createClass({
  getInitialState: function () {
    let username = JSON.parse(localStorage.getItem('username'));
    return {code: undefined, username: username, points: 0};
  },

  componentDidMount: function () {
    this.handelCodeRequest();
  },

  handleLoginSubmit: function (username, email) {
    let self = this;
    return Client.postLogin(username, email)
      .then(function () {
        console.log('Username: ', username);
        self.setState({username});
        localStorage.setItem('username', JSON.stringify(username));
        self.handelCodeRequest();
        return true;
      })
      .catch(function (error) {
        console.log('%O', error);
        if (parseInt(error.response.status, 10) === 403) { // username already exists!
          return false;
        } else {
           throw error;
        }
      });
  },

  handelCodeRequest: function () {
    let self = this;
    if (!this.state.username) return Promise.resolve();
    return Client.getCode(this.state.username)
      .then(function(res) {
        console.log('Got code', res.code)
        self.setState({code: res.code, points: res.points});
      })
  },

  handleCodeSubmit: function (matchCode) {
    let self = this;
    console.log('handleCodeSubmit', matchCode);
    return Client.postMatchCode(this.state.username, matchCode)
      .then(function ({accepted, points}) {
        self.setState({points});
        if (accepted) {
          self.setState({code: '----'});
          self.handelCodeRequest();
          return true;
        } else {
          return false;
        }
      })
  },


  render() {
    return (
      <div className="ui center aligned basic segment" >
        <Header />
        <AudioPlayer code={this.state.code}/>
        <CodeArea code={this.state.code} onCodeSubmit={this.handleCodeSubmit}/>
        <Points username={this.state.username} points={this.state.points}/>
        <NextButton onNextClick={this.handelCodeRequest}/>
        <ModalSetUser username={this.state.username} onLoginSubmit={this.handleLoginSubmit}/>
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

    console.log(this.state);

    if (Object.keys(fieldErrors).length) return;

  
    this.props.onLoginSubmit(person.username, person.email)
      .then(function (isOk){
        if (!isOk) {
          console.log('User duplicate!');
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
        <audio src={ this.props.code && "http://localhost:4000/api/song/" + this.props.code} onTimeUpdate={updateTrackTime}/>
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
    evt.preventDefault();

    if (!isValid) return;

    console.log('codearea', matchCode);

    this.props.onCodeSubmit(matchCode);
    this.setState({ matchCode: ''});
  },

  onInputChange(evt) {
    this.setState({ matchCode: evt.target.value });
  },

  validate(matchCode) {
    const errors = {};
    parseInt(matchCode, 10);
    return true;
  },

  render() {
    return (
    <div className="ui centered grid">
      <div className="ui twelve wide column center aligned raised segment">
        <p>Give your code to a match </p>
        <div className="ui black button">
          <i className="exchange icon"></i> {this.props.code}
        </div>
        <div className="ui horizontal divider">
          Or
        </div>
        <p>Enter code of match</p>
        <div className="ui left icon mini action input">
          <i className="exchange icon"></i>
          <input placeholder="Code" value={this.state.matchCode} onChange={this.onInputChange} />
          <button className="ui green submit button" onClick={this.onFormSubmit}>Enter</button>
        </div>
      </div>
    </div>
    );
  }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


function Points(props) {
  return (
    <div id="main" className="ui center aligned basic segment">
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
