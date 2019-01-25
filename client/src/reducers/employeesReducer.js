import {
  FETCH_EMPLOYEES_FROM_DB_SUCCESS,
  FETCH_EMPLOYEES_FROM_DB_FAIL,
  UPDATE_TIME_OFF_REQUEST_SUCCESS,
  UPDATE_TIME_OFF_REQUEST_FAIL,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  LOGOUT
} from '../actions'

const initialState = {
  employees: [],
  error: ''
}

export const employeesReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_EMPLOYEES_FROM_DB_SUCCESS:
      return { employees: [...action.payload], error: '' }
    case FETCH_EMPLOYEES_FROM_DB_FAIL:
      return { ...initialState, error: 'fetching failed' }

    //verifies that the id of the time off request matches the time off id
    // and if it does it changes the status of the request on the DOM.
    case UPDATE_TIME_OFF_REQUEST_SUCCESS:
      const { payload: timeOff } = action
      return {
        ...state,
        employees: state.employees.map(employee => {
          if (employee.id === timeOff.user_id) {
            return {
              ...employee,
              time_off_requests: employee.time_off_requests.map(request => {
                if (request.id === timeOff.id) {
                  return timeOff
                } else {
                  return request
                }
              })
            }
          } else {
            return employee
          }
        })
      }
    case CREATE_EVENT: {
      const { payload: event } = action
      return {
        ...state,
        employees: state.employees.map(employee => {
          if (employee.id === event.user_id) {
            return {
              ...employee,
              events: [...employee.events, event]
            }
          } else {
            return employee
          }
        })
      }
    }
    case UPDATE_EVENT: {
      const { payload: event } = action
      return {
        ...state,
        employees: state.employees.map(employee => {
          if (employee.id === event.user_id) {
            return {
              ...employee,
              events: employee.events.map(candidate => {
                if (candidate.id === event.id) {
                  return event
                } else {
                  return candidate
                }
              })
            }
          } else {
            return employee
          }
        })
      }
    }
    case DELETE_EVENT: {
      const {
        payload: { user_id, event_id }
      } = action
      return {
        ...state,
        employees: state.employees.map(employee => {
          if (employee.id === user_id) {
            return {
              ...employee,
              events: employee.events.filter(candidate => {
                return candidate.id !== event_id
              })
            }
          } else {
            return employee
          }
        })
      }
    }
    case LOGOUT:
      return initialState
    default:
      return state
  }
}
