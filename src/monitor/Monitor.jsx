import React from 'react';

import io from 'socket.io-client';
import './Monitor.css';



const CONFIG  = require('../../config.js');


const Monitor = React.createClass({
  render() {
    return (
        <div className="ui two column internally celled grid full-window-height">
          <div className="column">
            <Header/>
            <div className="ui divider"></div>
            <Guide />
            <div className="ui divider"></div>
            <Statistics />
            <Ranking />
          </div>
          <div className="column">
            <NewsFeed />
          </div>
        </div>
    );
  }
});

function Header(props) {
  return (
    <div className="ui center aligned basic segment no-margins" >
      <h2 >
        <i className="music icon"></i>
        Disco Match
        <i className="music icon"></i>
      </h2>
      <p className="no-margins-paddings">A gamification of Silent Disco...</p>
      <p className="no-margins-paddings">Find a dancer with your song!</p>
    </div>

  );
}

function Guide(props) {
  return (
    <div className="ui centered grid" >
      <div className="two wide column">
      </div>
      <div className="fourteen wide column">
        <div className="ui large ordered list">
          <GuideItem icon="wifi" text={<span>Connect your phone to the Wifi <a>DISCO-MATCH</a></span>}/>
          <GuideItem icon="signal" text="Switch off your mobile-data" />
          <GuideItem icon="chrome" text={<span>Visit <a>disco-match.me  (192.168.1.107:4000)</a> with your browser</span>} />
          <GuideItem icon="add user" text={`Enter a username and optionally an email (+${CONFIG.POINTS_EMAIL}Points)`} />
          <GuideItem icon="volume up" text="Plug some headphones" />
          <GuideItem icon="exchange" text={`Find players with the same song and exchange a code (+${CONFIG.POINTS_MATCH}Points)`} />
          <GuideItem icon="forward" text={`Click 'Next' after ${CONFIG.TIME_TO_NEXT_S} seconds or a match;
                                           But better dance until the end (+${CONFIG.POINTS_SONG_END}Points)`} />
          <GuideItem icon="talk" text={`Gain points, have fun, be lekker...  and tweet (+${CONFIG.POINTS_TWEET}Point)`} />
        </div>
      </div>

    </div>

  );
}

function GuideItem(props) {
  return (
    <div className="item">
      <i className={`large ${props.icon} icon`}></i>
      <div className="content">
        {props.text}
      </div>
    </div>
  );
}




const Statistics = React.createClass({
  getInitialState: function () {
    return {
      nbUsers: 0,
      nbSongs: 0
    };
  },

  componentDidMount: function () {
    let self = this;
    self.socket = io('/monitor');

    self.socket.on('send:statistics', function (stats) {
      // eslint-disable-next-line
      stats.nbUsers && self.setState({nbUsers: stats.nbUsers})
      // eslint-disable-next-line
      stats.nbSongs && self.setState({nbSongs: stats.nbSongs})
    });
  },

  render() {
    return (
      <div className="ui two column centered grid" >
        <div className="column">
          <div className="ui statistics">
            <div className="ui statistic">
              <div className="value">
                <i className="child icon"> </i>
                <a> {this.state.nbUsers}</a>
              </div>
              <div className="label"> Players </div>
            </div>
            <div className="ui statistic">
              <div className="value">
                <i className="music icon"> </i>
                <a> {this.state.nbSongs}</a>
              </div>
              <div className="label"> Songs </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
});


const Ranking = React.createClass({
  getInitialState: function () {
    return {
      ranking: [{username: '', points: 0}]
    };
  },

  componentDidMount: function () {
    let self = this;

    self.socket = io('/monitor');

    self.socket.on('send:ranking', function (ranking) {
      self.setState({ranking: ranking});
    });
  },

  render() {
    return (
      <div className="ui five column grid">
      {this.state.ranking.map((usr, i) => <RankingItem {...usr} rank={i+1} key={i} />)}
      </div>
    );
  }
});


function RankingItem(props) {
  return (
    <div className="column">
      <div className="large item">
        <span className="">
          <strong style={{fontSize: '150%'}}># {props.rank} </strong>
        </span>
        <span className="content top aligned ">
          <a className="header" style={{verticalAlign:'top'}}>{props.username}</a>
          <div>({props.points} points)</div>
        </span>
      </div>
    </div>
  );
}



const NewsFeed = React.createClass({
  getInitialState: function () {
    const initalMessage = `Welcome to disco-match!
    Here is how it works:
       + Login by providing a username and optionally your email
       + Plug your headphones
       + A song will start playing (be patient...).
       + Dance and sing along as much as you can!
       + Identify other dancers with the same song as yours
       + Exchange codes to gain points (One exchange is enough for both of you)
       + Keep playing!`;
    return {
      newsEvents: [{type: 'message', points: +0, data: {username: 'Disco-Match', message: initalMessage}}]
    };
  },

  componentDidMount: function () {
    let self = this;

    self.socket = io('/monitor');
    self.socket.on('connect', () => {console.log('connect')});
    self.socket.on('connection', () => {console.log('connection')});

    self.socket.on('send:newsEvent', function (event) {
      console.log(event);
      let events = self.state.newsEvents;
      events.push(event);
      if (events.length > CONFIG.MAX_NEWS_EVENTS) {
        events.shift();
        console.log(events);
      }
      self.setState({newsEvents: events});
    });
  },

  render() {

    return (
      <div className="ui feed chat">
        {this.state.newsEvents.map((evt, i) => <NewsEvent event={evt} key={i}/>)}
      </div>
    );
  }
});

// <NewsEvent event={{type: 'match', points: +50, data: {username: 'Michel', matchUsername: 'Petra', song: 'Recondite'}}} />
// <NewsEvent event={{type: 'next', points: -5, data: {username: 'Michel', song: 'Recondite'}}} />
// <NewsEvent event={{type: 'message', points: +1, data: {username: 'Michel', message: 'Whow, this is amazing!'}}} />
// <NewsEvent event={{type: 'login', points: +10, data: {username: 'Michel', message: 'Whow, this is amazing!'}}} />


function NewsEvent({event}) {
  const EVENT_TYPE_ICON = {
    match: 'exchange',
    next: 'forward',
    message: 'talk',
    login: 'add user'
  };

  function formatSummary (event) {
    let data = event.data;
    switch(event.type) {
      case 'match':
        return (
          <div>
            <a>{data.username}</a> found <a>{data.matchUsername}</a> on <a>{data.song}</a>
          </div>);
      case 'next':
        return (
          <div>
            <a>{data.username}</a> didn't like <a>{data.song}</a>
          </div>);
      case 'message':
        return (
          <div>
            <a>{data.username}:</a> {data.message.split('\n').map((s, i) => i==0 ? s : <div key={i}>{s}</div> )}
          </div>);
      case 'login':
        return (
          <div>
            <a>{data.username}</a> joined. Welcome!
          </div>);
      default:
        throw new Error('Unrecognized event type: ' + event.type);
    }
  }

  return (
    <div className="event no-margins" >
      <div className="label" >
        <i className={`big ${EVENT_TYPE_ICON[event.type]} icon`}></i>
      </div>
      <div className="content no-margins-paddings" >
        <div className="summary" >
          {formatSummary(event)}
        </div>
        <div className="meta no-margins-paddings" >
          {event.points} Points
        </div>
      </div>
    </div>
  );
}




export default Monitor;
