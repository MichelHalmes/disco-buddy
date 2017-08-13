
// code
// matchedCurrentCode
// username
// isInactive
// points
//

import { combineReducers } from 'redux';
import Client from './Client.js';

" ======= POINTS ======== "

// ACTIONS & ACTION_CREATORS
const UPDATE_POINTS = 'UPDATE_POINTS'
export function updatePointsAC(points) {
  return (dispatch, getState) => {
    let prevPoints = getState().pointsReducer
    if (prevPoints < points) {
      dispatch(pushMessageAC(`Congrats; You have gained ${points-prevPoints} points! :-)`))
    } else if (prevPoints > points) {
      dispatch(pushMessageAC(`Oooh; You have lost ${prevPoints-points} points! :-(`))
    }
    dispatch({type: UPDATE_POINTS, points})
  }
}

// REDUCER
function pointsReducer(state = 0, action) {
  switch (action.type) {
    case UPDATE_POINTS:
      return action.points
    default:
      return state
  }
}


" ======= LOGIN  ======== "

// ACTIONS & ACTION_CREATORS
const POST_LOGIN_REQUEST = 'POST_LOGIN_REQUEST'
function postLoginRequestAC() {
  return {type: POST_LOGIN_REQUEST}
}

const POST_LOGIN_SUCCESS = 'POST_LOGIN_SUCCESS'
function postLoginSuccessAC(username) {
  return {type: POST_LOGIN_SUCCESS, username}
}

const POST_LOGIN_FAILURE = 'POST_LOGIN_FAILURE'
function postLoginFailureAC(error) {
  return {type: POST_LOGIN_FAILURE, error}
}

const TRIGGER_LOGIN = 'TRIGGER_LOGIN'
function triggerLoginAC(error) {
  return {type: TRIGGER_LOGIN, error}
}

// Thunk action creator
export function postLoginAC(username, email) {
  username = username.trim();
  return (dispatch, getState) => {
    dispatch(postLoginRequestAC(username, email))
    return Client.postLogin(username, email)
      .then(res => {
        dispatch(postLoginSuccessAC(username))
        dispatch(updatePointsAC(res.points))
        dispatch(pushMessageAC(`Welcome ${username}!`))
        localStorage.setItem('username', JSON.stringify(username));
        dispatch(getCodeAC())
        return true;
      })
      .catch(error => {
        dispatch(postLoginFailureAC(error))
        if (error.response.status == 403) { // username already exists!
          return false;
        } else {
           throw error;
        }
      });
  }
}


// REDUCERS
const initalUsername = localStorage.getItem('username')===null ? JSON.parse(localStorage.getItem('username')) : null
function usernameReducer(state = initalUsername, action) {
  switch (action.type) {
    case POST_LOGIN_REQUEST:
      return state
    case POST_LOGIN_SUCCESS:
      localStorage.setItem('username', JSON.stringify(action.username)) // TODO: Should not go here!
      return  action.username
    case POST_LOGIN_FAILURE:
      return state
    case TRIGGER_LOGIN:
      return null
    default:
      return state
  }
}



" ======= CODE  ======== "

// ACTIONS & ACTION_CREATORS
const GET_CODE_REQUEST = 'GET_CODE_REQUEST'
function getCodeRequestAC() {
  return {type: GET_CODE_REQUEST}
}

const GET_CODE_SUCCESS = 'GET_CODE_SUCCESS'
function getCodeSuccessAC(code) {
  return {type: GET_CODE_SUCCESS, code}
}

const GET_CODE_FAILURE = 'GET_CODE_FAILURE'
function getCodeFailureAC(error) {
  return {type: GET_CODE_FAILURE, error}
}

const MATCH_CODE_SUCCESS = 'MATCH_CODE_SUCCESS'
export function matchCodeSuccessAC(matchUsername, points) {
  return (dispatch, getState) => {
    dispatch({type: MATCH_CODE_SUCCESS})
    dispatch(pushMessageAC(`You have matched with ${matchUsername}!`))
    dispatch(updatePointsAC(points))
    dispatch(pushMessageAC(`Click 'Next' for a new song!`))
  }
}

// Thunk action creator
export function getCodeAC() {
  return (dispatch, getState) => {
    let username = getState().usernameReducer;
    if (!username) {
      return false; // Needs login first!
    }
    dispatch(getCodeRequestAC())
    return Client.getCode(username)
      .then(res => {
        dispatch(getCodeSuccessAC(res.code))
        dispatch(updatePointsAC(res.points))
        return true;
      })
      .catch(error => {
        dispatch(getCodeFailureAC(error))
        if (error.response && error.status == 401) { // username not found
          dispatch(triggerLoginAC()) // Trigger new login
          localStorage.removeItem('username')
          return false;
        } else {
           throw error;
        }
      });
  }
}

// REDUCERS

function codeReducer(state = {code: 0, matchedCurrentCode: false}, action) {
  switch (action.type) {
    case GET_CODE_REQUEST:
      return Object.assign({}, state, {
        code: undefined
      })
    case GET_CODE_SUCCESS:
      return Object.assign({}, state, {
        code: action.code,
        matchedCurrentCode: false,
      })
    case GET_CODE_FAILURE:
      return Object.assign({}, state, {
        code: undefined
      })
    case MATCH_CODE_SUCCESS:
      return Object.assign({}, state, {
        matchedCurrentCode: true
      })
    default:
      return state
  }
}

" ======= MESSAGES ======== "

// ACTIONS & ACTION_CREATORS
const PUSH_MESSAGE = 'PUSH_MESSAGE'
export function pushMessageAC(message) {
  return {type: PUSH_MESSAGE, message}
}

const CLEAR_MESSAGES = 'CLEAR_MESSAGES'
export function clearMessagesAC() {
  return {type: CLEAR_MESSAGES, }
}

// REDUCER
function messagesReducer(state = [], action) {
  switch (action.type) {
    case PUSH_MESSAGE:
      return [...state, action.message]
    case CLEAR_MESSAGES:
      return []
    default:
      return state
  }
}

const rootReducer = combineReducers({
  pointsReducer,
  usernameReducer,
  codeReducer,
  messagesReducer
})

export default rootReducer
