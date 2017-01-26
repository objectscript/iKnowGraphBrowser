import React from 'react'
import ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as sigmajs from 'linkurious'
import * as utils from './utils'
import * as tooltipInfo from "./tooltipInfo";

import * as plugins from 'imports-loader?sigma=linkurious,this=>window!linkurious/dist/plugins'

import './scss/graph.scss';

const MODES = ['all', 'filtered', 'selected'];

export default class GraphViz extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired,
        onSelected: React.PropTypes.func.isRequired,
        filter: React.PropTypes.any.isRequired,
        selectedNodes: React.PropTypes.array.isRequired,
    };
    state = {
        sizeParam: 'frequency',
        mode: 'filtered',
    };

    registerSigmaElement(element) {
        //element could be null and we would want to cleanup
        this.sigmaNode = element;
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

    componentDidMount() {
        this.sigma = this.createSigmaInstance();
        this.initGraph();
    }

    initGraph() {
        this.sigma.settings('labelThreshold', this.props.graph.nodes.length < 300 ? 3 : 5);
        this.prepareGraph(this.sigma.graph, this.props.graph);
        this.addParentInfo();
        this.updateSizes();
        //this.sigma.refresh();
        this.startLayout();

    }

    componentDidUpdate(prevProps, prevState) {
        //check if the graph has changed. If it had, recreate it
        if (prevProps.graph != this.props.graph) {
            this.sigma.graph.clear();
            this.sigma.refresh();
            this.resetLayout();
            this.initGraph();
            this.update();
        }
        if (prevState.sizeParam != this.state.sizeParam) this.updateSizes();

        if (!_.isEqual(prevProps.selectedNodes, this.props.selectedNodes) ||
            !_.isEqual(prevProps.filter, this.props.filter)) {
            this.update();
        }
    }

    createSigmaInstance(node) {
        let sigma = new sigmajs.sigma({
            graph: this.emptyGraph(),
            renderer: {
                container: this.sigmaNode,
                type: 'canvas'
            },
            settings: {
                maxNodeLabelLineLength: 10,
                animationsTime: 2000,
                zoomMin: 0.01,
                enableEdgeHovering: false,
                nodeActiveBorderSize: 2,
                nodeActiveOuterBorderSize: 3,
                defaultNodeActiveBorderColor: '#fff',
                defaultNodeActiveOuterBorderColor: 'rgb(236, 81, 72)',
            }
        });
        this.addTooltip(sigma);
        this.enableCustomSelection(sigma);
        this.addFilter(sigma);
        return sigma;
    }

    addFilter = (sigma) => {
        this.filter = sigmajs.sigma.plugins.filter(sigma);
    };

    update = () => {
      this.updateFilter();
      this.updateSelection();
    };

    updateFilter = () => {
        const {filter, selectedNodes} = this.props;
        const {value, frequency, spread, score} = filter;
        const {mode} = this.state;

        if (mode === 'all') {
            this.filter.undo().apply();
        } else if (mode === 'filtered') {
            this.filter.undo().nodesBy((node) => {
                return (node.label.indexOf(value) === 0) &&
                    (this.frequencyFn(node) ? this.frequencyFn(node) > frequency : true) &&
                    (this.spreadFn(node) ? this.spreadFn(node) > spread : true) &&
                    (this.scoreFn(node) ? this.scoreFn(node) > score : true);
                }
            ).apply();
        } else if (mode === 'selected') {
            this.filter.undo().nodesBy(node => selectedNodes.indexOf(node.id) !== -1).apply();
        }
    };

    updateSelection = () => {
        this.activeState.dropNodes();
        this.activeState.addNodes(this.props.selectedNodes);
        this.sigma.refresh();
    };

    enableCustomSelection(sigma) {
        // Instanciate the ActiveState plugin:
        this.activeState = sigmajs.sigma.plugins.activeState(sigma);
        var activeNodesCallback = _.debounce(function(event) {
            console.log('active nodes:', activeState.nodes());
        }, 250);
        sigma.bind('clickNode', this.onClick);
    }

    onClick = (event) => {
        //If selecting with shift key, select all descendants
        let affectedNodes = [];
        if (event.data.captor.shiftKey) {
            affectedNodes = this.computeDescendants(this.sigma.graph, [event.data.node.id]);
        } else {
            affectedNodes = [event.data.node.id];
        }

        if (this.props.selectedNodes.indexOf(event.data.node.id) === -1) {
            this.props.onSelectionAdd(affectedNodes);
        } else {
            this.props.onSelectionRemove(affectedNodes);
        }
    };

    computeDescendants(graph, currentDescendants, allDescendants = []) {
        if (allDescendants.length == 0) allDescendants = currentDescendants;
        let nextDescendants = _.chain(currentDescendants)
            .flatMap(nodeId => graph.adjacentEdges(nodeId).map(edge => ({nodeId: nodeId, edge: edge})))
            .filter(edgeInfo => edgeInfo.edge.source == edgeInfo.nodeId)
            .map(edgeInfo=> edgeInfo.edge.target).value();
        allDescendants = _.concat(allDescendants, nextDescendants);
        if (nextDescendants.length == 0) return allDescendants;
        return this.computeDescendants(graph, nextDescendants, allDescendants);
    }

    updateSizes() {
        let paramFn;
        switch (this.state.sizeParam) {
            case 'frequency': paramFn = this.frequencyFn; break;
            case 'spread': paramFn = this.spreadFn; break;
            case 'score': paramFn = this.scoreFn; break;
        }
        let stat = this.getRange(paramFn);
        const {mn: mnStat, mx: mxStat} = stat;
        this.sigma.graph.nodes().forEach(node => {
            node.size = node.data ? utils.normalizeCoeff(paramFn(node), mnStat, mxStat, 100) : 120
        });
        this.sigma.refresh();
    }

    frequencyFn(node) {
        return node.data && node.data.frequency ? node.data.frequency : undefined;
    };

    spreadFn(node) {
        return node.data && node.data.spread ? node.data.spread : undefined;
    };

    scoreFn(node) {
        return node.data && node.data.score ? node.data.score : undefined;
    };

    getRange = (paramFn) => {
        if (this.sigma && this.sigma.graph) {
            return utils.computeMinMax(this.sigma.graph.nodes(), paramFn);
        } else {
            return {mn: undefined, mx: undefined}
        }
    };

    prepareGraph(g, srcData) {
        // const stat = utils.computeMinMax(srcData.nodes, node => node.entities ? node.entities[0].frequency : 1);
        // const {mn: mnStat, mx: mxStat} = stat;
        _.each(srcData.nodes, node => {
            g.addNode({
                id: node.id,
                label: node.label,
                x: Math.random(),
                y: Math.random(),
                // size: node.entities ? this.normalizeCoeff(node.entities[0].frequency, mnStat, mxStat, 100) : 120,
                type: 'circle', //could be linkurious-specific
                color: node.id == 0 ? '#FFFFFF' : '#5B9BD5',
                borderSize: node.id == 0 ? 2 : 0,
                borderColor: node.id == 0 ? '#5B9BD5' : '#FFFFFF',
                data: node.entities ? node.entities[0] : undefined
            })
        });

        var colors = {related: '#ED7D31', similar: '#5B9BD5'};

        _.each(srcData.edges, edge => {
            g.addEdge({
                id: 'e' + edge.origin + 'to' + edge.destination,
                source: edge.origin,
                target: edge.destination,
                /*size: Math.random(),*/
                color: colors[edge.type],
                type: 'arrow',
                data: {
                    type: edge.type
                }
            });
        });

        return g;
    }

    addParentInfo = () => {
        _.each(this.sigma.graph.nodes(), node => {
            let parentInfo = this.getParentInfo(node.id)
            if (parentInfo) {
                node.parentLabel = parentInfo.parentLabel;
                node.edgeType = parentInfo.edgeType;
            }
        });
    };

    getParentInfo(nodeId) {
        const parentEdge = _.find(this.sigma.graph.adjacentEdges(nodeId), edge => edge.target == nodeId);
        const parent = parentEdge ? this.sigma.graph.nodes(parentEdge.source) : undefined;
        return parent ? {parentLabel : parent.label, edgeType: parentEdge.data.type} : undefined;
    }

    startLayout() {
        /*var fa = this.sigma.startForceAtlas2({worker: true, scalingRatio: 100, gravity: 1, barnesHutOptimize: true, adjustSizes: false, strongGravityMode: true, startingIterations: 5, iterationsPerRender: 5});
        window.setTimeout(function() {s.stopForceAtlas2(); s.killForceAtlas2();}
            , 3000);*/
        var fa = sigmajs.sigma.layouts.configForceLink(this.sigma, {
            worker: true,
            autoStop: true,
            maxIterations: 200,
            background: true,
            scaleRatio: 2,
            strongGravityMode: false,
            gravity: 2,
            barnesHutOptimize: true,
            easing: 'cubicInOut',
            slowDown: 0.5
        });
        sigmajs.sigma.layouts.startForceLink();
    }

    resetLayout() {
        sigmajs.sigma.layouts.killForceLink();
    }

    addTooltip(s) {
        var tooltipConfig = {
            node: [{
                //show: 'clickNode',
                // hide: 'hovers',
                show: 'hovers',
                hide: 'hovers',
                cssClass: 'card',
                position: 'top',
                renderer: function(node, template) {
                    // The function context is s.graph
                    node.degree = this.degree(node.id);

                    let NodeTemplate = tooltipInfo.NodeTemplate;

                    var el = document.createElement('div');
                    ReactDOM.render(<NodeTemplate node={node} />, el);
                    return el;
                }
            }]
        };
        var tooltips = sigmajs.sigma.plugins.tooltips(s, s.renderers[0], tooltipConfig);
    }

    render() {
        const {mode} = this.state;

        return (
            <div className="card-block graph-block">
                <div className="graph-block__header">
                    <h4 className="card-title graph-block__caption">Graph visualization</h4>
                    <div className="btn-group graph-block__modes">
                        {MODES.map((item, index) => {
                            const className = mode === item ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm";
                            return (
                                <button key={index}
                                        type="button"
                                        className={className}
                                        onClick={() => this.setState({mode: item}, this.update)}>
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="graph-view">
                    <div id="graph" className='graph-container' ref={(element) => this.registerSigmaElement(element)}/>
                    {this.renderSizeMenu()}
                    {/* <div id="nodeSizePanel" style={{position: 'absolute', right: '10px', bottom: 0, width: '260px', height: '170px'}} className="card">
                     <div className="card-block small">
                     <div><kbd>spacebar</kbd> + <kbd>click</kbd> Multi-select</div>
                     <div><kbd>spacebar</kbd> + <kbd>s</kbd> Lasso tool</div>
                     <div><kbd>spacebar</kbd> + <kbd>a</kbd> Select/deselect all</div>
                     <div><kbd>spacebar</kbd> + <kbd>u</kbd> Deselect all</div>
                     <div><kbd>spacebar</kbd> + <kbd>Del</kbd> Drop selected</div>
                     <div><kbd>spacebar</kbd> + <kbd>e</kbd> Select neighbors</div>
                     <div><kbd>spacebar</kbd> + <kbd>i</kbd> Select isolated</div>
                     <div><kbd>spacebar</kbd> + <kbd>l</kbd> Select leaf</div>
                     </div>
                     </div>*/}
                </div>
            </div>
        );
    }

    renderSizeMenu = () => (
        <div id="nodeSizePanel" style={{position: 'absolute', left: '10px', bottom: 0, width: '150px', height: '130px'}} className="card">
            <div className="card-block">
                <h6 className="card-title">Node size</h6>
                <form>
                    <div className="input-group input-group-sm">
                        <label className="form-check-label">
                            <input id="param-frequency" name="nodeSizeParam" type="radio" value="frequency" className="form-check-input"
                                   checked={this.state.sizeParam == 'frequency'}
                                   onChange={() => this.setState({sizeParam: 'frequency'})}/>
                            frequency
                        </label>
                    </div>
                    <div className="input-group input-group-sm">
                        <label className="form-check-label">
                            <input id="param-spread" name="nodeSizeParam" type="radio" value="spread" className="form-check-input"
                                   checked={this.state.sizeParam == 'spread'}
                                   onChange={() => this.setState({sizeParam: 'spread'})}/>
                            spread
                        </label>
                    </div>
                    <div className="input-group input-group-sm">
                        <label className="form-check-label">
                            <input id="param-score" name="nodeSizeParam" type="radio" value="score" className="form-check-input"
                                   checked={this.state.sizeParam == 'score'}
                                   onChange={() => this.setState({sizeParam: 'score'})}/>
                            score
                        </label>
                    </div>
                </form>
            </div>
        </div>
    );

    emptyGraph() {
        return {
            nodes: [],
            edges: []
        };
    }
}