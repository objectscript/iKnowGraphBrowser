import {render} from 'react-dom';
import React from 'react';

import GraphWorkspace from './GraphWorkspace';

import './styles.scss';

class iKnowBrowser {
    constructor(container, graph) {
        render(React.createElement(GraphWorkspace, {graph: graph}), container);
    }
}

module.exports = iKnowBrowser;
