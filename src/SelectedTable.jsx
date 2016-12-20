import React from 'react'
import * as fileSaver from 'file-saver'

export default class SelectedTable extends React.Component {
    propTypes: {
        selectedNodes: React.PropTypes.array.isRequired
    };
    render() {
        return (
            <div>
                <div className="text-muted">Count: {this.props.selectedNodes.length} nodes</div>
                <div style={{height: 635, overflowY: 'auto'}}>
                    <table className="table table-sm small">
                        <tbody>
                        <tr><th>id</th><th>value</th><th>parent</th><th>link</th>{/*<th>frq</th><th>sc</th><th>sprd</th>*/}</tr>
                        {_(this.props.selectedNodes).sortBy(node => node.value).map(node =>
                            <tr key={node.id}>
                                <td>{node.id}</td>
                                <td style={{maxWidth: 100}}>{node.value}</td>
                                <td>{node.parentLabel}</td>
                                <td>{node.edgeType}</td>
                                {/*<td className="text-xs-right">{node.frequency}</td>
                                <td className="text-xs-right">{node.score}</td>
                                <td className="text-xs-right">{node.spread}</td>*/}
                                <td><button className="btn btn-danger btn-sm" onClick={() => this.props.onRemoved(node, true)}>x</button></td>
                            </tr>
                        ).value()}
                        </tbody>
                    </table>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => console.log(this.exportCsv())}>Export CSV</button>
            </div>
        );
    }

    exportCsv = () => {
       const csv = this.formatHeader() + "\n" + _(this.props.selectedNodes).map(this.formatRow).reduce((accu, row)=>accu + "\n" + row);
       var blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
       fileSaver.saveAs(blob, "iKnowSelectedNodes.csv")
    }

    formatHeader() {
        return 'id,value,parent,edgeType'
    }

    formatRow(row) {
        return row.id + ',"' + row.value + '","' + row.parentLabel + '","' + row.edgeType + '"';
    }
}