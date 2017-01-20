import {render} from 'react-dom'
import React from 'react'

import GraphWorkspace from '../GraphWorkspace'

document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'root';
    container.className = 'demo-root';
    document.body.appendChild(container);

    const scenario = 'related';
    const seed = 'tumor';
    fetch(scenario + '/' + seed).
    then(result => result.json()).
    then(result => {
          const graph = result.graph;
          graph.nodes.push({
                "id": 0,
                "label": seed,
                "type": "entity",
              }
            );
        render (React.createElement(GraphWorkspace, {graph: graph}), container);
        }
     );

});
