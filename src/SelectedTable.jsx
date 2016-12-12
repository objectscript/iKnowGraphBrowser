import React from 'react'

export default class SelectedTable extends React.Component {
    propTypes: {
        selectedNodes: React.PropTypes.array.isRequired
    };
    render() {
        return (
            <div>
                <div className="text-muted">Count: {this.props.selectedNodes.length} nodes</div>
                <div style={{height: 675, overflowY: 'auto'}}>
                    <table className="table table-sm small">
                        <tbody>
                        <tr><th>id</th><th>value</th><th>frq</th><th>sc</th><th>sprd</th></tr>
                        {_(this.props.selectedNodes).sortBy(node => node.value).map(node =>
                            <tr key={node.id}>
                                <td>{node.id}</td>
                                <td style={{maxWidth: 100}}>{node.value}</td>
                                <td className="text-xs-right">{node.frequency}</td>
                                <td className="text-xs-right">{node.score}</td>
                                <td className="text-xs-right">{node.spread}</td>
                            </tr>
                        ).value()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}