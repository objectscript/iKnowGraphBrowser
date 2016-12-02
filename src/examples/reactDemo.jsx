import {render} from 'react-dom'
import React from 'react'

import ScenarioSelector from '../ScenarioSelector'

document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    render (<ScenarioSelector />, container);
});