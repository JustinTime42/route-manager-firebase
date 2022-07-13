import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import axios from "axios"
import { Dropdown, DropdownButton, Button, FormControl, Alert } from "react-bootstrap"
import Can from "../auth/Can"
import { AuthConsumer } from "../authContext"
import { setActiveRoute, requestRoutes, getRouteData, requestAllAddresses, setActiveProperty, setActiveItem } from "../actions"
import {SET_ACTIVE_PROPERTY} from '../../constants.js'

const editStyle = {
    float: "right"
} // future feature

//Deprecated Component
const RouteSelector = () => {
    const [showEdit, setShowEdit] = useState(false)
    const [routeName, setRouteName] = useState("")
    const [deleteAlert, setDeleteAlert] = useState('')
    const activeRoute = useSelector(state => state.setActiveRoute.activeRoute)
    const customers = useSelector(state => state.requestAllAddresses.addresses)
    const routes = useSelector(state => state.requestRoutes.routes)
    const isPending = useSelector(state => state.requestRoutes.isPending)
    const dispatch = useDispatch()

    useEffect(() => {
        console.log("is activeRoute changing??")
        dispatch(requestRoutes())
        dispatch(requestAllAddresses())
        dispatch(getRouteData())
        dispatch(setActiveProperty(null))
    }, [activeRoute])
    
    const handleSave = () => {
        axios.post(`${process.env.REACT_APP_API_URL}/addroute`, { route_name: routeName })
        .then(res => {
          console.log(res)
          dispatch(requestRoutes())
          dispatch(getRouteData())
          dispatch(setActiveRoute(routeName))
          setRouteName('')
        })
        .catch(err => console.log(err))         
    }

    const onDelete = (route_name) => {
        console.log(route_name)
        axios.post(`${process.env.REACT_APP_API_URL}/delroute`, { route_name })
        .then(res => {
            console.log("del route", res)
            setRouteName('')
            dispatch(requestRoutes())
            dispatch(getRouteData())
            dispatch(setActiveRoute(''))
        })
        .catch(err => console.log)        
    }   

    const showConfirm = (route_name) => {
        setDeleteAlert(route_name)
    }

    const handleEditClick = () => {
        setShowEdit(!showEdit)
        setDeleteAlert('')
    }

    const onSelect = (event) => {
        dispatch(setActiveItem(null, customers, SET_ACTIVE_PROPERTY))
        dispatch(setActiveRoute(event))
        
    }

    return isPending ? <p>Loading</p> :
        (           
        <DropdownButton size="sm" title={activeRoute || "Select Route"} onSelect={event => onSelect(event)} >      
                <AuthConsumer>
                {({ user }) => (
                    <Can
                        role={user.role}
                        perform="admin:visit"
                        yes={() => (
                            <div><Button style={{marginLeft:"1em"}} variant="primary" size="sm" onClick={handleEditClick}>{showEdit ? "Close" : "Edit"}</Button></div>           
                        )}
                        no={() => null}
                    />
                )}
                </AuthConsumer>  
            {
                routes.map((route, i) => {
                    return (
                        <div key={i} style={{display: "flex"}}>
                            <Dropdown.Item eventKey={route.route_name}>{route.route_name}</Dropdown.Item>
                            <Button 
                                style={{visibility: (showEdit && (deleteAlert !== route.route_name)) ? "initial" : "hidden"}} 
                                onClick={() => showConfirm(route.route_name)}>
                                Delete
                            </Button>
                            <Alert show={deleteAlert === route.route_name} variant="danger">
                            <Alert.Heading>Delete {route.route_name}</Alert.Heading>
                                <div className="d-flex justify-content-end">
                                    <Button onClick={() => setDeleteAlert('')}>Cancel</Button>
                                    <Button onClick={() => onDelete(route.route_name)} variant="outline-success">Delete Route</Button>
                                </div>
                            </Alert>
                        </div> 
                    )
                })
            }
            <div style={{visibility: showEdit ? "initial" : "hidden", display: "flex"}}>
                <FormControl size="sm" type="text" onChange={(event) => setRouteName(event.target.value)} placeholder="new route" value={routeName} />
                <Button size="sm" onClick={handleSave}>Save</Button>                
            </div>  
        </DropdownButton>    
        )
}

export default RouteSelector