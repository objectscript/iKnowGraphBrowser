import React from 'react'

export function NodeTemplate(props) {
    return (
        <div>
            <div className="card-block"><h4 className="card-title">{props.node.label}</h4>
                <table className="table table-sm">
                    {props.node.data ?
                        <tbody>
                        <tr><th>id</th><td>{props.node.id}</td></tr>
                        <tr><th>frequency</th><td>{props.node.data.frequency}</td></tr>
                        <tr><th>score</th><td>{props.node.data.score}</td></tr>
                        <tr><th>spread</th><td>{props.node.data.spread}</td></tr>
                        </tbody> :
                        <tbody>
                        <tr><th>id</th><td>{props.node.id}</td></tr>
                        </tbody>
                    }
                </table>
            </div>
            <div className="card-footer text-muted">Number of connections: {props.node.degree}</div>
        </div>
    );
}