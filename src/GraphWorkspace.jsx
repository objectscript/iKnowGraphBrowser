import React from 'react'
import GraphViz from './GraphViz'
import SelectedTable from './SelectedTable'

export default class GraphWorkspace extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    };
    state = {
        selectedNodes: []
    };
    render() {
        return (
            <div className="card">
                <div className="card-block">
                    <h4 className="card-title">Graph visualization</h4>
                    {(this.props.graph && this.props.graph.nodes.length) > 0 ?
                        <div className="row">
                            <div className="col-md-9">
                                <GraphViz graph={this.props.graph} selectedNodes={this.state.selectedNodes}
                                      onSelected={this.onSelected}/>
                            </div>
                            <div className="col-md-3">
                                <SelectedTable selectedNodes={this.state.selectedNodes} onSelected={this.onSelected}/>
                            </div>
                        </div>
                    :
                       <div>No data to visualize</div>}
                </div>
            </div>
        );
    }

    onSelected = (nodes) => {
        this.setState({selectedNodes : nodes});
    }
}