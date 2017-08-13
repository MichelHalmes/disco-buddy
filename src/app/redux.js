
// code
// matchedCurrentCode
// username
// isInactive
// points
//

import { combineReducers } from 'redux';
import Client from './Client.js';


// ACTIONS & ACTION_CREATORS
const UPDATE_POINTS = 'UPDATE_POINTS'
export function updatePointsAC(points) {
  return {type: UPDATE_POINTS, points}
}

const POST_LOGIN_REQUEST = 'POST_LOGIN_REQUEST'
function postLoginRequest() {
  return {type: POST_LOGIN_REQUEST}
}

const POST_LOGIN_SUCCESS = 'POST_LOGIN_SUCCESS'
function postLoginSuccess(points, username) {
  return {type: POST_LOGIN_SUCCESS, points, username}
}

const POST_LOGIN_FAILURE = 'POST_LOGIN_FAILURE'
function postLoginFailure(error) {
  return {type: POST_LOGIN_FAILURE, error}
}

// Thunk action creator
export function postLoginAC(username, email) {
  username = username.trim();
  return (dispatch, getState) => {
    dispatch(postLoginRequest(username, email))
    return Client.postLogin(username, email)
      .then(res => {
        dispatch(postLoginSuccess(res.points, username))
        return true;
      })
      .catch(error => {
        dispatch(postLoginFailure(error))
        return false;
      })
  }
}



// handleLoginSubmit: function (username, email) {
//   let self = this;
//   username = username.trim();
//   return Client.postLogin(username, email)
//     .then(function (res) {
//       self.setState({username});
//       self.props.updatePoints(res.points);
//       localStorage.setItem('username', JSON.stringify(username));
//       self.handelCodeRequest();
//       return true;
//     })
//     .catch(function (error) {
//       // eslint-disable-next-line
//       if (error.response.status == 403) { // username already exists!
//         return false;
//       } else {
//          throw error;
//       }
//     });
// },




// REDUCERS
const initalState = {
  points: 0,
  username: JSON.parse(localStorage.getItem('username'))
}

function appReducer(state = initalState, action) {
  switch (action.type) {
    case UPDATE_POINTS:
      return Object.assign({}, state, {
        points: action.points
      })
    case POST_LOGIN_REQUEST:
      return state
    case POST_LOGIN_SUCCESS:
    //       self.handelCodeRequest();
      localStorage.setItem('username', JSON.stringify(action.username));
      return Object.assign({}, state, {
        points: action.points,
        username: action.username

      })
    case POST_LOGIN_FAILURE:
      if (action.error.response.status == 403) { // username already exists!
        return Object.assign({}, state, {
          username: undefined
        })
      }
      throw action.error;
    default:
      return state
  }
}

function otherReducer(state = null, action) {
  switch (action.type) {
    default:
      return state
  }
}


const rootReducer = combineReducers({
  appReducer,
  otherReducer
})

export default rootReducer
