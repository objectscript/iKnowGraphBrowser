import React from 'react'
import GraphViz from './GraphViz'
import SelectedTable from './SelectedTable'

export default class GraphWorkspace extends React.Component {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    };
    state = {
        selectedNodes: []
    };
    render() {
        return (
            (this.props.graph && this.props.graph.nodes.length) > 0 ?
                <div>
                    <GraphViz graph={this.props.graph} selectedNodes={this.state.selectedNodes}
                              onSelected={this.onSelected}/>
                    <SelectedTable selectedNodes={this.state.selectedNodes} onSelected={this.onSelected}/>
                </div>
            :
                <div>No data to visualize</div>
        );
    }

    onSelected = (id, state) => {
        //add/remove nodes here

    }
}