import React from 'react'
import GraphViz from './GraphViz'
import NodesTable from './NodesTable'
import Filter from './Filter'

export default class GraphWorkspace extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    };
    state = {
        selectedNodes: [],
        filter: {
            value: '',
            frequency: 0,
            spread: 0,
            score: 0,
        },
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.props.graph != prevProps.graph) {
            this.setState({selectedNodes:[]})
        }
    }

    render() {
        return (
                (this.props.graph && this.props.graph.nodes.length) > 0 ?
                    <div className="row main-container">
                        {this.filterBlock()}
                        <div className="graph-workspace">
                            {this.nodesBlock()}
                            {this.graphBlock()}
                        </div>
                    </div>
                            :
                    <div className="row graph-workspace" >
                        <div className="col-md-12">No data to visualize</div>
                    </div>
        );
    }

    filterBlock = () => {
        return <div className="filter-container">
            <Filter graph={this.props.graph} onChange={this.onFilterChange}/>
        </div>
    };

    nodesBlock = () => {
        return <div className="card nodes-table-container">
            <NodesTable graph={this.props.graph}
                        filter={this.state.filter}
                        selectedNodes={this.state.selectedNodes}
                        onSelectionAdd={this.onSelectionAdd}
                        onSelectionRemove={this.onSelectionRemove}/>
        </div>;
    };

    graphBlock = () => {
        return <div className="card graph-panel">
            <GraphViz graph={this.props.graph}
                      filter={this.state.filter}
                      selectedNodes={this.state.selectedNodes}
                      onSelectionAdd={this.onSelectionAdd}
                      onSelectionRemove={this.onSelectionRemove}/>
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
        const newSelected = _.unionBy(this.state.selectedNodes, nodes);
        this.setState({selectedNodes: newSelected});
    };

    onSelectionRemove = (nodes) => {
        const newSelected = _.differenceBy(this.state.selectedNodes, nodes);
        this.setState({selectedNodes: newSelected});
    };

    onFilterChange = filter => {
        this.setState({filter});
    };

}