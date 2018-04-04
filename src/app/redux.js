
import { combineReducers } from 'redux';
import Client from './Client.js';
const CONFIG  = require('../../config.js');

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
      .then(
        res => {
          dispatch(postLoginSuccessAC(username))
          dispatch(updatePointsAC(res.points))
          dispatch(pushMessageAC(`Welcome ${username}!`))
          localStorage.setItem('username', JSON.stringify(username));
          dispatch(getCodeAC())
          return true;
        },
        error => {
          if (error.response.status == 403) { // username already exists!
            dispatch(postLoginFailureAC('Username already used!'))
            return false;
          } else {
            dispatch(postLoginFailureAC(error))
            throw error;
          }
        });
  }
}


// REDUCERS
const initalUsername = localStorage.getItem('username')!==null ? JSON.parse(localStorage.getItem('username')) : null
function usernameReducer(state = initalUsername, action) {
  switch (action.type) {
    case POST_LOGIN_REQUEST:
      return state
    case POST_LOGIN_SUCCESS:
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

const BUDDY_CODE_MATCH = 'BUDDY_CODE_MATCH'
export function buddyCodeMatchAC(buddyUsername, points) {
  return (dispatch, getState) => {
    dispatch({type: BUDDY_CODE_MATCH})
    dispatch(pushMessageAC(`You found your buddy '${buddyUsername}'!`))
    dispatch(updatePointsAC(points))
    dispatch(pushMessageAC(`Click 'Next' for a new song!`))
  }
}

// Thunk action creator
export function getCodeAC() {
  return (dispatch, getState) => {
    let username = getState().usernameReducer;
    if (!username) {
      dispatch(getCodeFailureAC('No username defined!'))
      return false // Needs login first!
    }
    if (!dispatch(checkActivityAC())) {
      dispatch(getCodeFailureAC('User is Inactive'))
      return false
    }
    dispatch(getCodeRequestAC())
    return Client.getCode(username)
      .then(
        res => {
          dispatch(getCodeSuccessAC(res.code))
          dispatch(updatePointsAC(res.points))
          dispatch(pushMessageAC(`New song; New luck!`))
          return true;
        },
        error => {
          if (error.status == 401) { // username not found
            dispatch(getCodeFailureAC(`The username ${username} does not exist`))
            localStorage.removeItem('username')
            dispatch(triggerLoginAC()) // Trigger new login
            return false;
          } else {
            dispatch(getCodeFailureAC(error))
            throw error;
          }
        });
  }
}

export function postBuddyCodeAC(buddyCode) {
  return (dispatch, getState) => {
    let username = getState().usernameReducer;
    return Client.postBuddyCode(username, buddyCode)
      .then(function ({accepted, points, buddyUsername}) {
        if (accepted) {
          dispatch(buddyCodeMatchAC(buddyUsername, points))
          return true;
        } else {
          dispatch(pushMessageAC(`Nope, not the same song!`))
          dispatch(updatePointsAC(points))
          return false;
        }
      })
  }
}


// REDUCERS

function codeReducer(state = {code: 0, matchedCurrentCode: false}, action) {
  switch (action.type) {
    case GET_CODE_REQUEST:
      return {...state,
        code: undefined
      }
    case GET_CODE_SUCCESS:
      return {...state,
        code: action.code,
        matchedCurrentCode: false,
      }
    case GET_CODE_FAILURE:
      return {...state,
        code: undefined
      }
    case BUDDY_CODE_MATCH:
      return {...state,
        matchedCurrentCode: true
      }
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

" ======= INACTIVITY ======== "

// ACTIONS & ACTION_CREATORS
const RECORD_ACTIVITY = 'RECORD_ACTIVITY'
export function recordActivityAC() {
  return {type: RECORD_ACTIVITY}
}

const REACTIVATE = 'REACTIVATE'
export function reactivateAC() {
  return (dispatch, getState) => {
    dispatch({type: REACTIVATE})
    if (!getState().codeReducer.code) {
      dispatch(getCodeAC())
    }
  }
}

const SET_INACTIVE = 'SET_INACTIVE'
function checkActivityAC() {
  return (dispatch, getState) => {
    let lastActivity = getState().activityReducer.lastActivity
    if (new Date().getTime() - lastActivity > CONFIG.TIME_TO_INACTIVE_S * 1000) {
      dispatch({type: SET_INACTIVE})
      return false
    } else {
      return true
    }
  }
}

// REDUCER
function activityReducer(state = {isActive: true, lastActivity: new Date().getTime()}, action) {
  switch (action.type) {
    case RECORD_ACTIVITY:
      return {...state,
        lastActivity: new Date().getTime()
      }
    case REACTIVATE:
      return {...state,
        isActive: true,
        lastActivity: new Date().getTime()
      }
    case SET_INACTIVE:
      return {...state,
        isActive: false
      }
    default:
      return state
  }
}

" -------- ROOT_REDUCER -------- "

const rootReducer = combineReducers({
  pointsReducer,
  usernameReducer,
  codeReducer,
  messagesReducer,
  activityReducer
})

export default rootReducer
