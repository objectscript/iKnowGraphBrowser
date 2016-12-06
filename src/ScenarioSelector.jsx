import React from 'react'
import Filter from './Filter'

export default class ScenarioSelector extends React.Component {

    state = {
        scenario: "related",
        seed: "disease",
        graph: undefined,
        fetching: false,
        msg: "",
    }

    render() {
        return (
            <div>
                <div className="card">
                    <div className="card-block">
                        <h4 className="card-title">Scenario Selection</h4>
                            <form className="form-inline">
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
                                <input type="button" onClick={this.onGo} value="Go" className="btn btn-primary"/>
                                <div className="text-xs-center">{this.state.msg}</div>
                                {this.state.fetching ? <progress className="progress" value="50" max="100"></progress> : undefined}
                            </form>
                    </div>
                </div>
                <Filter graph={this.state.graph} />
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
        this.setState({msg: 'Fetching data...', fetching: true});0
        fetch(this.state.scenario + '/' + this.state.seed).
            then(result => result.json()).
            then(result => {
                this.setState({msg: "Fetching done.", fetching: false, graph: this.prepareGraph(result.graph)});
            }
        )
    }

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




