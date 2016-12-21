import React from 'react'
import GraphViz from './GraphViz'
import SelectedTable from './SelectedTable'
import Filter from './Filter'

export default class GraphWorkspace extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    };
    state = {
        selectedNodes: [],
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.props.graph != prevProps.graph) {
            this.setState({selectedNodes:[]})
        }
    }

    render() {
        return (
                (this.props.graph && this.props.graph.nodes.length) > 0 ?
                    <div className="row graph-workspace">
                        {this.selectedBlock()}
                        {this.graphBlock()}
                    </div>
                            :
                    <div className="row graph-workspace" >
                        <div className="col-md-12">No data to visualize</div>
                    </div>
        );
    }



    selectedBlock = () => {
        return <div className="card selected-nodes-panel">
            <div className="card-block selected-nodes-block">
                <h4 className="card-title">Selected Nodes</h4>
                <SelectedTable selectedNodes={this.state.selectedNodes} onRemoved={this.onTableRemoved}/>
            </div>
        </div>;
    };

    graphBlock = () => {
        return <div className="card graph-panel">
            <div className="card-block graph-block">
                <h4 className="card-title">Graph visualization</h4>
                <GraphViz graph={this.props.graph} selectedNodes={this.state.selectedNodes}
                          onSelectionAdd={this.onSelectionAdd} onSelectionRemove={this.onSelectionRemove}/>
            </div>
        </div>
    };

    computeDescendants(graph, currentDescendants, allDescendants = []) {
        if (allDescendants.length == 0) allDescendants = currentDescendants;
        let nextDescendants = _.chain(graph.edges)
            .filter(edge => currentDescendants.includes(edge.origin))
            .map(edge=> edge.destination).value();
        allDescendants = _.concat(allDescendants, nextDescendants);
        if (nextDescendants.length == 0) return allDescendants;
        return this.computeDescendants(graph, nextDescendants, allDescendants);
    }

    onTableRemoved = (node, recursive) => {
        const affectedNodes = (recursive) ? this.computeDescendants(this.props.graph, [node.nodeId]) : [node.nodeId];
        let newSelected = _.filter(this.state.selectedNodes, node => !affectedNodes.includes(node.nodeId));
        this.setState({selectedNodes: newSelected});
    };

    onSelectionAdd = (nodes) => {
        var newSelected = _.unionBy(this.state.selectedNodes, nodes, (node)=>node.nodeId);
        this.setState({selectedNodes : newSelected});
    };

    onSelectionRemove = (nodes) => {
        var newSelected = _.differenceBy(this.state.selectedNodes, nodes, node=>node.nodeId);
        this.setState({selectedNodes: newSelected});
    };


}