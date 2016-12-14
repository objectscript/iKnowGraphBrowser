import React from 'react'
import ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as sigmajs from 'linkurious'


import * as plugins from 'imports-loader?sigma=linkurious,this=>window!linkurious/dist/plugins'


export default class GraphViz extends React.PureComponent {
    propTypes: {
        graph: React.PropTypes.any.isRequired,
        onSelected: React.PropTypes.func.isRequired
    };
    state = {
        selectedNodes: [],
        sizeParam: 'frequency'
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
        this.updateSizes();
        //this.sigma.refresh();
        this.startLayout();
        this.addTooltip(this.sigma);
        this.enableSelection();
    }

    componentDidUpdate(prevProps, prevState) {
        //check if the graph has changed. If it had, recreate it
        if (prevProps.graph != this.props.graph) {
            this.sigma.graph.clear();
            this.sigma.refresh();
            this.resetLayout();
            this.initGraph();
            this.selectionChanged([]);
        }
        if (prevState.sizeParam != this.state.sizeParam) this.updateSizes();
    }

    createSigmaInstance(node) {
        let sigma = new sigmajs.sigma({
            graph: this.emptyGraph(),
            renderer: {
                container: this.sigmaNode,
                type: 'canvas'
            },
            settings: {
                animationsTime: 2000,
                zoomMin: 0.01,
                enableEdgeHovering: false,
                nodeActiveBorderSize: 2,
                nodeActiveOuterBorderSize: 3,
                defaultNodeActiveBorderColor: '#fff',
                defaultNodeActiveOuterBorderColor: 'rgb(236, 81, 72)',
            }
        });
        return sigma;
    }

    selectionChanged(nodes) {
        this.props.onSelected(_.map(nodes,
            (node) => {
              const newNode = node.data ? node.data : {id: node.id, value: node.label};
                const parentInfo = this.getParentInfo(node.id);
                if (parentInfo) {
                    newNode.parentLabel = parentInfo.parentLabel;
                    newNode.edgeType = parentInfo.edgeType;
                }
              return newNode;
            })
        );
    }

    getParentInfo(nodeId) {
        const parentEdge = _.find(this.sigma.graph.adjacentEdges(nodeId), edge => edge.target == nodeId);
        const parent = parentEdge ? this.sigma.graph.nodes(parentEdge.source) : undefined;
        return parent ? {parentLabel : parent.label, edgeType: parentEdge.data.type} : undefined;
    }

    enableSelection() {
        // Instanciate the ActiveState plugin:
        var activeState = sigmajs.sigma.plugins.activeState(this.sigma);
        var activeNodesCallback = _.debounce(function(event) {
            console.log('active nodes:', activeState.nodes());
        }, 250);
        //activeState.bind('activeNodes', activeNodesCallback);

        activeState.bind('activeNodes', _.debounce((event)=> this.selectionChanged(activeState.nodes()), 250));
        var keyboard = sigmajs.sigma.plugins.keyboard(this.sigma, this.sigma.renderers[0]);

        // Initialize the Select plugin:
        var select = sigmajs.sigma.plugins.select(this.sigma, activeState);
        select.bindKeyboard(keyboard);

        // Initialize the dragNodes plugin:
        var dragListener = sigmajs.sigma.plugins.dragNodes(this.sigma, this.sigma.renderers[0], activeState);

        var lasso = new sigmajs.sigma.plugins.lasso(this.sigma, this.sigma.renderers[0], {
            'strokeStyle': 'rgb(236, 81, 72)',
            'lineWidth': 2,
            'fillWhileDrawing': true,
            'fillStyle': 'rgba(236, 81, 72, 0.2)',
            'cursor': 'crosshair'
        });

        select.bindLasso(lasso);
        //lasso.activate();

        //"spacebar" + "s" keys pressed binding for the lasso tool
        keyboard.bind('32+83', function() {
            if (lasso.isActive) {
                lasso.deactivate();
            } else {
                lasso.activate();
            }
        });

        // Listen for selectedNodes event
        lasso.bind('selectedNodes', event => {
            setTimeout(() => {
                lasso.deactivate();
                this.sigma.refresh({ skipIdexation: true });
            }, 0);
        });
    }

    updateSizes() {
        let paramFn;
        switch (this.state.sizeParam) {
            case 'frequency': paramFn = node => node.data && node.data.frequency ? node.data.frequency : 1; break;
            case 'spread': paramFn = node => node.data && node.data.spread ? node.data.spread : 1; break;
            case 'score': paramFn = node => node.data && node.data.score ? node.data.score : 1; break;
        }
        const stat = this.computeNormalizeCoeff(this.sigma.graph.nodes(), paramFn);
        const {mn: mnStat, mx: mxStat} = stat;
        this.sigma.graph.nodes().forEach(node => {
            node.size = node.data ? this.normalizeCoeff(paramFn(node), mnStat, mxStat, 100) : 120
        });
        this.sigma.refresh();
    }

    computeNormalizeCoeff(nodes, accessFn) {
        //this is not efficient for compute time
        const mn = _.minBy(nodes, accessFn);
        const mx = _.maxBy(nodes, accessFn);
        return {mn: accessFn(mn), mx: accessFn(mx)};
    }

    /**
     * Normalized value from min and max to
     * @param value
     * @returns {number}
     */
    normalizeCoeff(value, mn, mx, limit) {
        return (value - mn) * mn/mx * (limit - 1) + 20;
    }

    prepareGraph(g, srcData) {
        // const stat = this.computeNormalizeCoeff(srcData.nodes, node => node.entities ? node.entities[0].frequency : 1);
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
                // autoadjust: true,
                //template: ' ',
                /*' <div class="card-block"><h4 class="card-title">{{label}}</h4>' +
                '    <table class="table table-sm">' +
                '      <tr><th>id</th> <td>{{id}}</td></tr>' +
                '      <tr><th>frequency</th> <td>{{data.frequency}}</td></tr>' +
                '      <tr><th>score</th> <td>{{data.score}}</td></tr>' +
                '      <tr><th>spread</th> <td>{{data.spread}}</td></tr>' +
                '    </table>' +
                ' </div>' +
                '  <div class="card-footer text-muted">Number of connections: {{degree}}</div>',*/
                renderer: function(node, template) {
                    // The function context is s.graph
                    node.degree = this.degree(node.id);

                    function NodeTemplate(props) {
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

                    var el = document.createElement('div');
                    ReactDOM.render(<NodeTemplate node={node} />, el);
                    return el;
                }
            }, /*{
                show: 'rightClickNode',
                cssClass: 'sigma-tooltip',
                position: 'right',
                template:
                '<div class="arrow"></div>' +
                ' <div class="sigma-tooltip-header">{{label}}</div>' +
                '  <div class="sigma-tooltip-body">' +
                '   <p> Context menu for {{data.value}} </p>' +
                '  </div>' +
                ' <div class="sigma-tooltip-footer">Number of connections: {{degree}}</div>',
                renderer: function(node, template) {
                    node.degree = this.degree(node.id);
                    return Mustache.render(template, node);
                }
            }*/],
            /*stage: {
                template:
                '<div class="arrow"></div>' +
                '<div class="sigma-tooltip-header"> Menu </div>'
            }*/
        };
        var tooltips = sigmajs.sigma.plugins.tooltips(s, s.renderers[0], tooltipConfig);
    }

    render() {
        return (
            <div>
                <div id="graph" style={{width: '100%', height: '700px'}} ref={(element) => this.registerSigmaElement(element)}/>
                <div id="nodeSizePanel" style={{position: 'absolute', left: '10px', bottom: 0, width: '150px', height: '130px'}} className="card">
                    <div className="card-block">
                        <h6 className="card-title">Node size is</h6>
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
                <div id="nodeSizePanel" style={{position: 'absolute', right: '10px', bottom: 0, width: '260px', height: '170px'}} className="card">
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
                </div>
            </div>
        );

    }

    emptyGraph() {
        return {
            nodes: [],
            edges: []
        };
    }
}