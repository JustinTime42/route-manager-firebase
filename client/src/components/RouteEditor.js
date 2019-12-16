import React, { Component } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { connect } from "react-redux"
import { requestAllAddresses, getRouteProperties, UpdateRouteProperties, saveRoute, setActiveProperty } from "../actions"
import Button from 'react-bootstrap/Button'
import axios from "axios"
import PropertyCard from "./PropertyCard"
import NewProperty from "./NewProperty"
import '../styles/driver.css'

const mapStateToProps = state => {
    return {
        activeProperty: state.setActiveProperty.activeProperty,
        activeRoute: state.setActiveRoute.activeRoute,
        addresses: state.requestAllAddresses.addresses, 
        routeProperties: state.getRouteProperties.addresses,
        isRoutePending: state.getRouteProperties.isPending,
        isAllPending: state.requestAllAddresses.isPending,
        error: state.requestAllAddresses.error, 
    }
}

const mapDispatchToProps = (dispatch) => {
    return {    
        onSaveRoute: (route) => dispatch(saveRoute(route)),
        onGetAllAddresses: () => dispatch(requestAllAddresses()),
        onSetActiveProperty: (property) => dispatch(setActiveProperty(property)),
        onGetRouteProperties: (route) => dispatch(getRouteProperties(route))
        //onUpdateRouteProperties: (properiesy, routeName) => dispatch(UpdateRouteProperties(properties, routeName))
    }
}

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const grid = 2;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    height: "600px", 
    overflow: "scroll", 
    width: "90%"
});

class RouteEditor extends Component {
    constructor(props){
        super(props)
        this.state = { 
            items: [],
            filteredItems: [],
            selected: [],
            searchField: '',
            showModal: false
        }
    }
    
    componentDidMount() {
        this.props.onGetAllAddresses() 
    }

    componentDidUpdate(prevProps) {
        if(prevProps.routeProperties !== this.props.routeProperties || prevProps.isAllPending !== this.props.isAllPending){
            console.log("new route properties")
          this.setState({selected: this.props.routeProperties })
          this.setState({items: this.props.addresses.filter(address => address.route_name !== this.props.activeRoute) })
          this.setState({filteredItems: this.props.addresses.filter(address => address.route_name !== this.props.activeRoute) }) 
        }
      }

    id2List = {
        droppable: 'filteredItems',
        droppable2: 'selected'
    };

    onSave = () => {
        axios.post('https://snowline-route-manager.herokuapp.com/api/saveroute', 
            {
                route: this.props.activeRoute,
                selected: this.state.selected,
                unselected: this.state.filteredItems
            }
        )
        .then(res => {
            this.props.onGetAllAddresses() 
            this.props.onGetRouteProperties(this.props.activeRoute)
            console.log(res)
        })
        .catch(err => console.log(err)) 
    }

    onInitRoute = () => {
        axios.post('https://snowline-route-manager.herokuapp.com/api/initroute',
            {
                route: this.state.selected               
            }
        )
        .then(res => {
            this.props.onGetAllAddresses() 
            this.props.onGetRouteProperties(this.props.activeRoute)
            console.log(res)
        })
        .catch(err => console.log)
        this.onSave()
    }
    
    getList = id => this.state[this.id2List[id]];

    onDragEnd = result => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const filteredItems = reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );

            let state = { filteredItems };

            if (source.droppableId === 'droppable2') {
                state = { selected: filteredItems };
            }

            this.setState(state);
        } else {
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );

            this.setState({
                filteredItems: result.droppable,
                selected: result.droppable2
            });
        }
    };

    handlePropertyClick = (property) => {
        this.props.onSetActiveProperty(property)
    }

    onSearchChange = (event) => {
        this.setState({searchField: event.target.value})
        let filteredItems = this.state.items.filter(property => {
          if (property.address && property.address.toLowerCase().includes(this.state.searchField.toLowerCase())) {
            return true
          } else if (property.route_name && property.route_name.toLowerCase().includes(this.state.searchField.toLowerCase())) {
            return true
          } else if (property.cust_name && property.cust_name.toLowerCase().includes(this.state.searchField.toLowerCase())) {
            return true
          } else if (property.cust_phone && property.cust_phone.toLowerCase().includes(this.state.searchField.toLowerCase())) {
            return true
          } else {return false}
        }
      )
        this.setState({filteredItems: filteredItems})
    }

    onNewPropertyClick = () => {
        this.props.onSetActiveProperty(null)
        this.setState({showModal: !this.state.showModal})
    }

    onEditPropertyClick = () => {
        this.setState({showModal: !this.state.showModal})
    }

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {
        
        return this.props.isAllPending || this.props.isRoutePending ?
        <h1>    </h1> :(
            <div className="gridContainer">
                 <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable2">                    
                    {(provided, snapshot) => (
                        <div
                            className="leftSide"
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                                <div style={{display: "flex", justifyContent: "space-around"}}>
                                    <Button variant="primary" size="sm" style={{margin: "3px"}} onClick={this.onSave}>Save Route</Button>
                                    <Button variant="primary" size="sm" style={{margin: "3px"}} onClick={this.onInitRoute}>Initialize Route</Button>
                                </div>
                                
                            {this.state.selected.map((item, index) => (
                                <Draggable
                                    key={item.key}
                                    draggableId={item.key.toString()}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            <PropertyCard key={item.address} address={item} admin={true} editClick={this.onEditPropertyClick} handleClick={this.handlePropertyClick}/>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable className="rightSide" droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            className="rightSide"
                            style={getListStyle(snapshot.isDraggingOver)}>
                                <div style={{display: "flex", justifyContent:"space-around", margin: "3px"}}>
                                    <input 
                                        type="search" placeholder="Search" 
                                        onChange={this.onSearchChange}
                                    />
                                    <Button variant="primary" size="sm" onClick={this.onNewPropertyClick}>New</Button>
                                </div>
                            {this.state.filteredItems.map((item, index) => (
                                <Draggable
                                    key={item.key}
                                    draggableId={item.key.toString()}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            <PropertyCard key={item.address} address={item} admin={true} editClick={this.onEditPropertyClick} handleClick={this.handlePropertyClick}/>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
                <NewProperty show={this.state.showModal} close={this.onNewPropertyClick}/>
            </div>
           
        );
    }
}   

export default connect(mapStateToProps, mapDispatchToProps)(RouteEditor)
