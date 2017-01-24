import React from 'react';
import { computeMinMax } from './utils'

import './scss/filter.scss';

export default class Filter extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired,
        onChange: React.PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            value: '',
            frequency: '0',
            spread: '0',
            score: '0',
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(nextProps.graph, this.props.graph)) {
            this.clearFilter();
        }
    }

    frequencyFn = node => {
        return node && node.entities && node.entities[0].frequency ? node.entities[0].frequency : undefined;
    };

    spreadFn = node => {
        return node && node.entities && node.entities[0].spread ? node.entities[0].spread : undefined;
    };

    scoreFn = node => {
        return node && node.entities && node.entities[0].score ? node.entities[0].score : undefined;
    };

    getRange = paramFn => {
        return computeMinMax(this.props.graph.nodes, paramFn);
    };

    onChange = () => {
        const {value, frequency, spread, score} = this.state;

        if (frequency.length && spread.length && score.length) {
            this.props.onChange({
                value,
                frequency: parseInt(frequency),
                spread: parseInt(spread),
                score: parseInt(score),
            });
        }
    };

    clearFilter = () => {
        this.setState({
            value: '',
            frequency: '0',
            spread: '0',
            score: '0',
        }, this.onChange);
    };

    render() {
        const {value, frequency, spread, score} = this.state;
        const frequencyMax = this.getRange(this.frequencyFn).mx;
        const spreadMax = this.getRange(this.spreadFn).mx;
        const scoreMax = this.getRange(this.scoreFn).mx;

        return <form className="filter">
            <div className="filter__content">
                <div className="filter__col">
                    <label className="filter__label col-form-label col-form-label-sm">value</label>
                    <input type="text"
                           className="filter__control form-control form-control-sm"
                           value={value}
                           onChange={e => this.setState({value: e.target.value}, this.onChange)}/>
                </div>
                <div className={frequency.length ? "filter__col" : "filter__col has-danger"}>
                    <label className="filter__label col-form-label col-form-label-sm">frequency</label>
                    <input type="range"
                           className="filter__control"
                           value={frequency.length ? parseInt(frequency) : 0}
                           max={frequencyMax}
                           onChange={e => this.setState({frequency: e.target.value}, this.onChange)}/>
                    <input type="number"
                           className="form-control form-control-sm filter__value col-form-label col-form-label-sm"
                           value={frequency}
                           min={0}
                           max={frequencyMax}
                           onChange={e => this.setState({frequency: e.target.value}, this.onChange)}/>
                </div>
                <div className={spread.length ? "filter__col" : "filter__col has-danger"}>
                    <label className="filter__label col-form-label col-form-label-sm">spread</label>
                    <input type="range"
                           className="filter__control"
                           value={spread.length ? parseInt(spread) : 0}
                           max={spreadMax}
                           onChange={e => this.setState({spread: e.target.value}, this.onChange)}/>
                    <input type="number"
                           className="form-control form-control-sm filter__value col-form-label col-form-label-sm"
                           value={spread}
                           min={0}
                           max={spreadMax}
                           onChange={e => this.setState({spread: e.target.value}, this.onChange)}/>
                </div>
                <div className={score.length ? "filter__col" : "filter__col has-danger"}>
                    <label className="filter__label col-form-label col-form-label-sm">score</label>
                    <input type="range"
                           className="filter__control"
                           value={score.length ? parseInt(score) : 0}
                           max={scoreMax}
                           onChange={e => this.setState({score: e.target.value}, this.onChange)}/>
                    <input type="number"
                           className="form-control form-control-sm filter__value col-form-label col-form-label-sm"
                           value={score}
                           min={0}
                           max={scoreMax}
                           onChange={e => this.setState({score: e.target.value}, this.onChange)}/>
                </div>
            </div>
            <button type="button" className="filter__btn btn btn-secondary btn-sm" onClick={this.clearFilter}>
                Clear filter
            </button>
        </form>;
    }
}
