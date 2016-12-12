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
            <div className="row">
                {(this.state.filteredGraph && this.state.filteredGraph.nodes.length) > 0 ?
                    <pair>
                        <div className="col-md-2 col-space">
                            <div className="card">
                                <div className="card-block">
                                    <h4 className="card-title">Selected Nodes</h4>
                                    <SelectedTable selectedNodes={this.state.selectedNodes} onSelected={this.onSelected}/>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8 col-space">
                            <div className="card">
                                <div className="card-block">
                                    <h4 className="card-title">Graph visualization</h4>
                                    <GraphViz graph={this.state.filteredGraph} selectedNodes={this.state.selectedNodes}
                                          onSelected={this.onSelected}/>
                                </div>
                            </div>
                        </div>
                    </pair>
                        :
                    <div className="col-md-10">No data to visualize</div>
                }
                <div className="col-md-2 col-space">
                    <div className="card">
                        <div className="card-block">
                            <h4 className="card-title">Filter</h4>
                            <Filter graph={this.props.graph} onResult={this.onFilteredGraph} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }



    onSelected = (nodes) => {
        this.setState({selectedNodes : nodes});
    }

    onFilteredGraph = (graph) => {
        this.setState({filteredGraph: graph});
    }
}