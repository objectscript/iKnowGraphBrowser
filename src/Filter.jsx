import React from 'react'
import GraphWorkspace from './GraphWorkspace'

export default class Filter extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    }
    state = {
        graph: this.props.graph,
        minFrequency: 0,
        minScore: 0,
        minSpread: 0
    };

    componentWillReceiveProps(nextProps) {
        this.setState({graph: nextProps.graph,
            minFrequency: 0,
            minScore: 0,
            minSpread: 0})
    }

    updateFilter = () => {
        if (this.props.graph.nodes) {
            const removeNodes = _(this.props.graph.nodes).filter(node => {
                if (node.entities) {
                    const entity = node.entities[0];
                    return !(entity.frequency > this.state.minFrequency && entity.spread > this.state.minSpread && (!entity.score || entity.score > this.state.minScore));
                } else return false;
            }).map(node => node.id).value();
            this.setState({
                graph: {
                    nodes: _(this.props.graph.nodes).filter(node => !_.includes(removeNodes, node.id)).value(),
                    edges: _(this.props.graph.edges).filter(edge => !(_.includes(removeNodes, edge.origin) || _.includes(removeNodes, edge.destination))).value()
                }
            });
        } else {
            this.setState({graph: this.emptyGraph()});
        }
    };

    emptyGraph() {
        return { nodes: [], edges: []};
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-2">
                    <div className="card">
                        <div className="card-block">
                            <h4 className="card-title">Filter</h4>
                            <form>
                                <div className="form-group">
                                    <label htmlFor="frequency">Min Frequency</label>
                                    <input id="frequency" className="form-control" type="text" value={this.state.minFrequency}
                                           onChange={e => {this.setState({minFrequency: parseFloat(e.target.value)}); }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="spread">Min Spread</label>
                                    <input id="spread" className="form-control" type="text" value={this.state.minSpread}
                                           onChange={e => {this.setState({minSpread: parseFloat(e.target.value)}); }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="score">Min Score</label>
                                    <input id="score" className="form-control" type="text" value={this.state.minScore}
                                           onChange={e => {this.setState({minScore: parseFloat(e.target.value)}); }} />
                                </div>
                                <input type="button" className="btn btn-primary" onClick={this.updateFilter} value="Update graph"/>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-md-10">
                    <GraphWorkspace graph={this.state.graph}/>
                </div>
            </div>);
    }
}