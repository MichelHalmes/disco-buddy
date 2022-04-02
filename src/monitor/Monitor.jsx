import React from 'react';

import io from 'socket.io-client';
import './Monitor.css';


const CONFIG  = require('../../config.js');

const Monitor = React.createClass({
  render() {
    return (
        <div className="ui two column internally celled grid main-body">
          <div className="column">
            <Header/>
            <div className="ui divider small-margins-paddings "></div>
            <Guide />
            <div className="ui divider"></div>
            <Statistics />
            <Ranking />
          </div>
          <div className="column">
            <NewsFeed />
            {/* <Footer /> */}
          </div>
        </div>
    );
  }
});

function Header(props) {
  return (
    <div className="ui center aligned basic segment no-margins-paddings" >
      <h2 className="small-margins-paddings">
        <i className="music icon"></i>
        Disco Buddy
        <i className="music icon"></i>
      </h2>
      <p className="no-margins-paddings">A gamification of Silent-Disco...</p>
      <p className="no-margins-paddings">Find a dancer with the same song as you!</p>
    </div>
  );
}

function Guide(props) {
  return (
    <div className="ui centered grid" >
      {/* <div className="one wide column">
      </div> */}
      <div className="fifteen wide column small-margins-paddings">
        <div className="ui large ordered list">
          <GuideItem icon="wifi" text={<span>Connect your phone to the Wifi <a>DISCO-BUDDY</a> (No internet!)</span>}/>
          {/* <GuideItem icon="signal" text="Switch off your mobile-data" /> */}
          <GuideItem icon="chrome" text={<span>Visit <a>disco-buddy.org</a> in your browser</span>} />
          <GuideItem icon="add user" text={`Enter a username`} />
          {/* and optionally an email (+${CONFIG.POINTS_EMAIL} Points) */}
          <GuideItem icon="volume up" text="Plug some headphones" />
          <GuideItem icon="exchange" text={`Find a buddy with the same song and exchange codes (+${CONFIG.POINTS_MATCH} Points)
                                          You can match only once per song...`} />
          <GuideItem icon="forward" text={`You may click 'Next' after ${CONFIG.TIME_TO_NEXT_S}sec;
                                           Better dance until the end (+${CONFIG.POINTS_SONG_END} Points)`} />
          <GuideItem icon="talk" text={`Gain points, have fun, be lekker...  and tweet (+${CONFIG.POINTS_TWEET} Points)`} />
          {/* <GuideItem icon="warning sign" text="Please roll up & return your headphones when you're done!!" /> */}
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
      <div className="ui two column centered grid no-margins-paddings" >
        <div className="column no-margins-paddings">
          <div className="ui statistics no-margins-paddings">
            <div className="ui statistic no-margins-paddings">
              <div className="value">
                <i className="child icon"> </i>
                <a> {this.state.nbUsers}</a>
              </div>
              <div className="label"> Players </div>
            </div>
            <div className="ui statistic no-margins-paddings">
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
      <div className="ui five column grid no-margins-paddings">
      {this.state.ranking.map((usr, i) => <RankingItem {...usr} rank={i+1} key={i} />)}
      </div>
    );
  }
});

function RankingItem(props) {
  return (
    <div className="column small-margins-paddings">
      <div className="large item">
        <div className="">
          <strong style={{fontSize: '150%'}}># {props.rank} </strong>
        </div>
        <span className="content top aligned ">
          <a className="header" style={{verticalAlign:'top'}}>{props.username}</a>
          <div>({props.points} points)</div>
        </span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
        For Wilfried! <i className="heart icon"></i>
        <a>  disco-buddy@mail.com  </a>
    </div>
  );
}

const NewsFeed = React.createClass({
  getInitialState: function () {
    const initalMessage = `Welcome to disco-buddy!
    Here is how it works:
       + Login by providing a username
       + Plug your headphones
       + A song will start playing (be patient...).
       + Dance and sing along as much as you can!
       + Identify other dancers with the same song as yours
       + Exchange codes to gain points (One exchange is enough for both of you)
       + Keep playing!`;
    return {
      newsEvents: [{type: 'message', points: +0, data: {username: 'Disco-Buddy', message: initalMessage}}]
    };
  },

  componentDidMount: function () {
    let self = this;

    self.socket = io('/monitor');
    self.socket.on('connect', () => {console.log('connect')});
    self.socket.on('connection', () => {console.log('connection')});

    self.socket.on('send:newsEvent', function (event) {
      let events = self.state.newsEvents;
      events.push(event);
      if (events.length > CONFIG.MAX_NEWS_EVENTS) {
        events.shift();
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


function NewsEvent({event}) {
  const EVENT_TYPE_ICON = {
    match: 'exchange',
    // next: 'forward',
    message: 'talk',
    login: 'add user'
  };

  function formatSummary (event) {
    let data = event.data;
    switch(event.type) {
      case 'match':
        return (
          <div>
            <a>{data.username}</a> found <a>{data.buddyUsername}</a> with <a>{data.song}</a>
          </div>);
      // case 'next': // DEPRECATED
      //   return (
      //     <div>
      //       <a>{data.username}</a> didn't like <a>{data.song}</a>
      //     </div>);
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
    <div className="event no-margins-paddings" >
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
