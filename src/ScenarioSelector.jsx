import React from 'react'
import GraphWorkspace from './GraphWorkspace'
require('./styles.scss')

export default class ScenarioSelector extends React.Component {

    state = {
        scenario: "related",
        seed: "disease",
        graph: undefined,
        fetching: false,
        msg: "",
        error: undefined,
    }

    renderError = () => {
        const {error} = this.state;

        return error
            ? (
                <div className="form-group has-danger">
                    <div className="form-control-feedback">Error: {error}</div>
                </div>
            )
            : null;
    };

    render() {
        return (
            <div className="container-fluid demo-root">
                <div className="row scenario-selection">
                    <div className="card col-md-12">
                        <div className="card-block">
                            <h4 className="card-title">Scenario Selection</h4>
                                <form className="form-inline" onSubmit={(e) => {this.onGo(); e.preventDefault();}}>
                                    <div className="form-group">
                                        <label htmlFor="seedText">Seed string</label>
                                        <input id="seedText" className="form-control" type="text" onChange={this.onTextChange} value={this.state.seed}/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="scenario">Scenario</label>
                                        <select id="scenario" className="form-control" onChange={this.onScenarioChange}>
                                            <option value="related">related</option>
                                            <option value="similar">similar</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <input type="button" onClick={this.onGo} value="Go" className="btn btn-primary"/>
                                    </div>
                                    {this.renderError()}
                                    {/*<div className="text-xs-center">{this.state.msg}</div>*/}
                                    {this.state.fetching ? <progress className="progress" value="50" max="100"></progress> : undefined}
                                </form>
                        </div>
                    </div>
                </div>
                <GraphWorkspace graph={this.state.graph} />
            </div>
        );
    }

    onTextChange = (e) => {
        this.setState({seed:  e.target.value});
    };

    onScenarioChange = (e) => {
        this.setState({scenario:  e.target.value});
    };

    onGo = () => {
        this.setState({msg: 'Fetching data...', fetching: true, error: undefined});
        fetch(this.state.scenario + '/' + this.state.seed)
            .then(result => {
                if (!result.ok) {
                    throw Error(result.statusText);
                }

                return result.json();
            })
            .then(result => {
                this.setState({
                    msg: "Fetching done.",
                    fetching: false,
                    graph: this.prepareGraph(result.graph),
                    error: undefined,
                });
            })
            .catch(e => {
                this.setState({msg: "Fetching failed.", fetching: false, graph: undefined, error: e.message});
            });
    };

    prepareGraph = (graph) => {
        graph.nodes.push(
            {
                "id": 0,
                "label": this.state.seed,
                "type": "entity",
                /*"entities": [
                    {
                        "frequency": -1,
                        "id": -1,
                        "score": -1,
                        "spread": -1,
                        "value": this.state.seed
                    }
                ],*/
            }
        );
        return graph;
    }
}




