import React from 'react'
import GraphWorkspace from './GraphWorkspace'

export default class Filter extends React.Component {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    }
    state = {
        graph: this.props.graph
    };

    componentWillReceiveProps(nextProps) {
        this.setState({graph: this.props.graph})
    }
    render() {
        return <div><GraphWorkspace graph={this.props.graph}/></div>;
    }
}