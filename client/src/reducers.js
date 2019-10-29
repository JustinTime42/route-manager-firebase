import { SET_ACTIVE_ROUTE, 
    REQUEST_ROUTES_PENDING,
    REQUEST_ROUTES_SUCCESS,
    REQUEST_ROUTES_FAILED 
} from './constants.js'
import { object } from 'prop-types'

const initialStateActiveRoute = {
    activeRoute: '' 
}

export const setActiveRoute = (state=initialStateActiveRoute, action={}) => {
    switch(action.type) {
        case SET_ACTIVE_ROUTE:
            return {...state, activeRoute: action.payload }
        default:    
            return state

    }
}

const initialStateRoutes = {
    isPending: false,
    routes: [],
    error: ''
}
export const requestRoutes = (state = initialStateRoutes, action={}) => {
    switch(action.type) {
        case REQUEST_ROUTES_PENDING: 
            return {...state, isPending: true}
        case REQUEST_ROUTES_SUCCESS:
            return {...state, routes: action.payload, isPending: false}
        case REQUEST_ROUTES_FAILED:
            return {...state, error: action.payload, isPending: false}
        default:
            return state
    }
}