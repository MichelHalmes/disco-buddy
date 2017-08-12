
// code
// matchedCurrentCode
// username
// isInactive
// points
//

import { combineReducers } from 'redux'


// ACTIONS
export const UPDATE_POINTS = 'UPDATE_POINTS'


// ACTION_CREATORS
export function updatePointsAC(points) {
  return {type: UPDATE_POINTS, points}
}


// REDUCERS
function pointsReducer(state = 0, action) {
  switch (action.type) {
    case UPDATE_POINTS:
      return action.points
    default:
      return state
  }
}

function codeReducer(state = null, action) {
  switch (action.type) {
    default:
      return state
  }
}



const appReducer = combineReducers({
  pointsReducer,
  codeReducer
})

export default appReducer
