import React from 'react'
import * as fileSaver from 'file-saver'

import './scss/nodes-table.scss';

const MODES = ['all', 'filtered', 'selected'];

export default class NodesTable extends React.Component {
    propTypes: {
        graph: React.PropTypes.any.isRequired,
        filter: React.PropTypes.any.isRequired,
        selectedNodes: React.PropTypes.array.isRequired,
        onSelectionAdd: React.PropTypes.func.isRequired,
        onSelectionRemove: React.PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            mode: 'filtered',
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {graph, selectedNodes} = this.props;
        const {mode} = this.state;

        return !(
            mode === nextState.mode &&
            (mode === 'all' || mode === 'selected') &&
            _.isEqual(graph, nextProps.graph) &&
            _.isEqual(selectedNodes, nextProps.selectedNodes)
        );
    };

    frequencyFn = node => {
        return node.entities && node.entities[0].frequency ? node.entities[0].frequency : undefined;
    };

    spreadFn = node => {
        return node.entities && node.entities[0].spread ? node.entities[0].spread : undefined;
    };

    scoreFn = node => {
        return node.entities && node.entities[0].score ? node.entities[0].score : undefined;
    };

    filterNode = node => {
        const {value, frequency, spread, score} = this.props.filter;

        return (node.label.indexOf(value) === 0) &&
            (this.frequencyFn(node) ? this.frequencyFn(node) > frequency : true) &&
            (this.spreadFn(node) ? this.spreadFn(node) > spread : true) &&
            (this.scoreFn(node) ? this.scoreFn(node) > score : true);
    };

    getNodeInfo = node => {
        const {graph} = this.props;

        const edge = graph.edges.filter(e => e.destination === node.id)[0];

        const parentLabel = edge
            ? graph.nodes.filter(node => node.id === edge.origin)[0].label
            : '';

        const edgeType = edge ? edge.type : '';

        return {
            id: node.id,
            value: node.label,
            parentLabel,
            edgeType,
        }
    };

    onClickNode = id => {
        if (this.props.selectedNodes.indexOf(id) === -1) {
            this.props.onSelectionAdd([id]);
        } else {
            this.props.onSelectionRemove([id]);
        }
    };

    computeDescendants(graph, currentDescendants, allDescendants = []) {
        if (!allDescendants.length) allDescendants = currentDescendants;

        const nextDescendants = graph.edges.filter(edge => {
            return currentDescendants.indexOf(edge.origin) !== -1;
        }).map(edge => edge.destination);

        allDescendants = _.concat(allDescendants, nextDescendants);

        if (!nextDescendants.length) return allDescendants;
        return this.computeDescendants(graph, nextDescendants, allDescendants);
    }

    onSelectAllDescendants = id => {
        const nodes = this.computeDescendants(this.props.graph, [id]);

        if (this.props.selectedNodes.indexOf(id) === -1) {
            this.props.onSelectionAdd(nodes);
        } else {
            this.props.onSelectionRemove(nodes);
        }
    };

    getNodes = () => {
        const {graph, selectedNodes} = this.props;
        const {mode} = this.state;

        if (mode === 'all') {
            return graph.nodes;
        } else if (mode === 'filtered') {
            return graph.nodes.filter(this.filterNode);
        } else if (mode === 'selected') {
            return graph.nodes.filter(node => {
                return selectedNodes.indexOf(node.id) !== -1;
            });
        } else {
            return [];
        }
    };

    render() {
        const {graph, selectedNodes} = this.props;
        const {mode} = this.state;
        const nodes = this.getNodes();
        return (
            <div className="card-block nodes-table">
                <div className="nodes-table__header">
                    <h4 className="card-title nodes-table__caption">Nodes</h4>
                    <div className="btn-group nodes-table__modes">
                        {MODES.map((item, index) => {
                            const className = mode === item ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm";
                            return (
                                <button key={index}
                                        type="button"
                                        className={className}
                                        onClick={() => this.setState({mode: item})}>
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="nodes-table__body">
                    <div className="text-muted nodes-table__count">
                        Total: {graph.nodes.length} nodes;
                        Shown: {nodes.length} nodes
                    </div>
                    <div style={{overflowY: 'auto'}}>
                        <table className="table table-sm small">
                            <tbody>
                            <tr><th>id</th><th>value</th><th>parent</th><th>link</th><th>&nbsp;</th></tr>
                            {_(nodes).sortBy(node => node.label).map(this.getNodeInfo).map(node =>
                                <tr key={node.id}
                                    onClick={() => this.onClickNode(node.id)}
                                    className={selectedNodes.indexOf(node.id) !== -1 ? 'nodes-table__row active' : 'nodes-table__row'}>
                                    <td>{node.id}</td>
                                    <td style={{maxWidth: 100}}>{node.value}</td>
                                    <td style={{maxWidth: 100}}>{node.parentLabel}</td>
                                    <td>{node.edgeType}</td>
                                    <td>
                                        <button type="button"
                                                className="btn btn-secondary btn-sm nodes-table__select-btn"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    this.onSelectAllDescendants(node.id);
                                                }}>
                                        </button>
                                    </td>
                                </tr>
                            ).value()}
                            </tbody>
                        </table>
                    </div>
                    <div className="nodes-table__footer">
                        <button type="button"
                                className="btn btn-primary nodes-table__export-btn"
                                onClick={() => console.log(this.exportCsv())}
                                disabled={nodes.length === 0}>
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    exportCsv = () => {
        const nodes = _(this.getNodes()).sortBy(node => node.label)
            .filter(this.filterNode)
            .map(this.getNodeInfo);
        const csv = this.formatHeader() + "\n" + _(nodes).map(this.formatRow).reduce((accu, row) => accu + "\n" + row);
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
        fileSaver.saveAs(blob, "iKnowNodes.csv")
    };

    formatHeader() {
        return 'id,value,parent,edgeType'
    }

    formatRow(row) {
        return row.id + ',"' + row.value + '","' + row.parentLabel + '","' + row.edgeType + '"';
    }
}