import React from 'react'
import Filter from './Filter'

export default class ScenarioSelector extends React.Component {

    state = {
        scenario: "similar",
        seed: "disease",
        graph: undefined,
        msg: "",
    }

    render() {
        return (
            <div>
                <input type="text" onChange={this.onTextChange} value={this.state.seed}/>
                <select name="scenario" onChange={this.onScenarioChange}>
                    <option value="similar">similar</option>
                    <option value="related">related</option>
                </select>
                <input type="button" onClick={this.onGo} value="Go" />
                <p>{this.state.msg}</p>
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
        this.setState({msg: "Fetching data..."});0
        fetch(this.state.scenario + '/' + this.state.seed).
            then(result => result.json()).
            then(result => {
                this.setState({msg: "Fetching done.", graph: this.prepareGraph(result.graph)});
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




