import React from 'react'
import ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as sigmajs from 'linkurious'
import * as utils from './utils'
import * as tooltipInfo from "./tooltipInfo";

import * as plugins from 'imports-loader?sigma=linkurious,this=>window!linkurious/dist/plugins'



export default class GraphViz extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired,
        onSelected: React.PropTypes.func.isRequired
    };
    state = {
        sizeParam: 'frequency',
        frequencyFilter: 0,
        spreadFilter: 0,
        scoreFilter: 0
    };

    registerSigmaElement(element) {
        //element could be null and we would want to cleanup
        this.sigmaNode = element;
    }

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
        }
        if (prevState.sizeParam != this.state.sizeParam) this.updateSizes();
        if (prevProps.selectedNodes != this.props.selectedNodes) {
            this.updateSelection();
        }
        if (prevState.frequencyFilter != this.state.frequencyFilter ||
            prevState.spreadFilter != this.state.spreadFilter ||
            prevState.scoreFilter != this.state.scoreFilter) {
            this.updateFilter();
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

    updateFilter = () => {
        this.filter.undo().nodesBy((node) => {
                return (this.frequencyFn(node) ? this.frequencyFn(node) > this.state.frequencyFilter : true) &&
                    (this.spreadFn(node) ? this.spreadFn(node) > this.state.spreadFilter : true) &&
                    (this.scoreFn(node) ? this.scoreFn(node) > this.state.scoreFilter : true);
            }
        ).apply();
    };

    updateSelection = () => {
        this.activeState.dropNodes();
        this.activeState.addNodes(_.map(this.props.selectedNodes, node => node.nodeId));
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

    transformNode(node) {
        const newNode = node.data ? node.data : {id: node.id, value: node.label};
        newNode.nodeId = node.id;
        newNode.parentLabel = node.parentLabel;
        newNode.edgeType = node.edgeType;
        return newNode;
    }

    onClick = (event) => {
        //If selecting with shift key, select all descendants
        let affectedNodes = [];
        if (event.data.captor.shiftKey) {
            affectedNodes = this.computeDescendants(this.sigma.graph, [event.data.node.id]);
        } else {
            affectedNodes = [event.data.node.id];
        }

        //transform nodeId list to nodes
        const eventNodes = _.chain(affectedNodes).map(nodeId => this.sigma.graph.nodes(nodeId)).map(this.transformNode).value();
        if (!_.find(this.props.selectedNodes, (node) => node.nodeId === event.data.node.id)) {
            this.props.onSelectionAdd(eventNodes);
        } else {
            this.props.onSelectionRemove(eventNodes);
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
        return (
            <div className="graph-view">
                <div id="graph" className='graph-container' ref={(element) => this.registerSigmaElement(element)}/>
                {this.renderSizeMenu()}
                {this.renderFilterPanel()}
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
        );
    }

    renderFilterPanel = () => (
        <div id="nodeSizePanel" style={{position: 'absolute', right: '10px', bottom: 0, width: '240px', height: '130px'}} className="card">
            <div className="card-block">
                <h6 className="card-title">Filter</h6>
                    <div className="row small">
                        <label htmlFor="frequency-filter" style={{width: 70, marginBottom: 2}}>frequency</label>
                        <input id="frequency-filter" type="range" value={this.state.frequencyFilter} max={this.getRange(this.frequencyFn).mx} style={{height: 10}}
                               onChange={(e) => this.setState({frequencyFilter: e.target.value})}/>
                        <span style={{marginLeft: 5}}>{this.state.frequencyFilter}</span>
                    </div>
                    <div className="row small">
                        <label htmlFor="spread-filter" style={{width: 70, marginBottom: 2}}>spread</label>
                        <input id="spread-filter" type="range" value={this.state.spreadFilter} max={this.getRange(this.spreadFn).mx} style={{height: 10}}
                               onChange={(e) => this.setState({spreadFilter: e.target.value})}/>
                        <span style={{marginLeft: 5}}>{this.state.spreadFilter}</span>
                    </div>
                    <div className="row small">
                        <label htmlFor="score-filter" style={{width: 70, marginBottom: 2}}>score</label>
                        <input id="score-filter" type="range" value={this.state.scoreFilter} max={this.getRange(this.scoreFn).mx} style={{height: 10}}
                               onChange={(e) => this.setState({scoreFilter: e.target.value})}/>
                        <span style={{marginLeft: 5}}>{this.state.scoreFilter}</span>
                    </div>
            </div>
        </div>
    );

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