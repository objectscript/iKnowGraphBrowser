import React from 'react'

export default class SelectedTable extends React.Component {
    propTypes: {
        selectedNodes: React.PropTypes.array.isRequired
    };
    render() {
        return (
            <div>
                <h5>Selected Nodes</h5>
                <div className="text-muted">Count: {this.props.selectedNodes.length} nodes</div>
                <table className="table table-sm">
                    <tbody style={{overflowY: 'auto', height: '650px', position: 'absolute'}}>{/*style={{overflowY: 'scroll'}}*/}
                    <tr><th>id</th><th>value</th><th>freq.</th><th>score</th><th>spread</th></tr>
                    {_(this.props.selectedNodes).sortBy(node => node.value).map(node =>
                        <tr key={node.id}>
                            <td>{node.id}</td>
                            <td>{node.value}</td>
                            <td>{node.frequency}</td>
                            <td>{node.score}</td>
                            <td>{node.spread}</td>
                        </tr>
                    ).value()}
                    </tbody>
                </table>
            </div>
        );
    }
}