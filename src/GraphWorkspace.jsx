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
        filteredGraph: {nodes: [], edges: []}
    };
    render() {
        return (
                (this.state.filteredGraph && this.state.filteredGraph.nodes.length) > 0 ?
                    <div className="row">
                        <div className="col-md-2 col-space">
                            {this.selectedBlock()}
                        </div>
                        <div className="col-md-8 col-space">
                            {this.graphBlock()}
                        </div>
                        <div className="col-md-2 col-space">
                            {this.filterBlock()}
                        </div>
                    </div>
                            :
                    <div className="row" >
                        <div className="col-md-10">No data to visualize</div>
                        <div className="col-md-2 col-space">
                            {this.filterBlock()}
                        </div>
                    </div>

        );
    }

    selectedBlock = () => {
        return <div className="card">
            <div className="card-block">
                <h4 className="card-title">Selected Nodes</h4>
                <SelectedTable selectedNodes={this.state.selectedNodes} onSelected={this.onSelected}/>
            </div>
        </div>;
    };

    graphBlock = () => {
        return <div className="card">
            <div className="card-block">
                <h4 className="card-title">Graph visualization</h4>
                <GraphViz graph={this.state.filteredGraph} selectedNodes={this.state.selectedNodes}
                          onSelectionAdd={this.onSelectionAdd} onSelectionRemove={this.onSelectionRemove}/>
            </div>
        </div>
    };

    filterBlock = () => {
        return <div className="card">
            <div className="card-block">
                <h4 className="card-title">Filter</h4>
                <Filter graph={this.props.graph} onResult={this.onFilteredGraph} />
            </div>
        </div>
    }

    onSelectionAdd = (nodes) => {
        var newSelected = _.unionBy(this.state.selectedNodes, nodes, (node)=>node.id);
        this.setState({selectedNodes : newSelected});
    };

    onSelectionRemove = (nodes) => {
        var newSelected = _.differenceBy(this.state.selectedNodes, nodes, node=>node.id);
        this.setState({selectedNodes: newSelected});
    };

    onFilteredGraph = (graph) => {
        this.setState({filteredGraph: graph});
    }
}