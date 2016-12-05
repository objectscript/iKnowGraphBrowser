import React from 'react'
import * as _ from 'lodash'
import * as sigmajs from 'linkurious'
import * as Mustache from 'mustache'


import * as plugins from 'imports-loader?sigma=linkurious,this=>window!linkurious/dist/plugins'


export default class GraphViz extends React.Component {
    propTypes: {
        graph: React.PropTypes.any.isRequired
    };
    state = {
        selectedNodes: []
    };

    emptyGraph() {
        return {
            nodes: [],
            edges: []
        };
    }

    createGraph = (element) => {
        if (element) {
            if (!this.sigma) {
                this.sigma = new sigmajs.sigma({
                    graph: this.emptyGraph(),
                    container: element
                });
            } else {
                this.sigma.graph.clear();
                this.sigma.refresh();
                //this.sigma.kill();
            }
            this.prepareGraph(this.sigma.graph, this.props.graph);
            this.sigma.refresh();
            this.layoutGraph(this.sigma);
            this.addTooltip(this.sigma);
        } else {

        }
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

        const stat = this.computeNormalizeCoeff(srcData.nodes, node => node.entities ? node.entities[0].frequency : 1);
        const {mn: mnStat, mx: mxStat} = stat;
        _.each(srcData.nodes, node => {
            g.addNode({
                id: node.id,
                label: node.label,
                x: Math.random(),
                y: Math.random(),
                size: node.entities ? this.normalizeCoeff(node.entities[0].frequency, mnStat, mxStat, 100) : 100,
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
                type: 'arrow'
            });
        });

        return g;
    }

    layoutGraph(s) {
        var fa = s.startForceAtlas2({worker: true, scalingRatio: 100, gravity: 1, barnesHutOptimize: true, adjustSizes: false, strongGravityMode: true});
        window.setTimeout(function() {s.stopForceAtlas2()}
            , 2000);
    }

    addTooltip(s) {
        var tooltipConfig = {
            node: [{
                show: 'clickNode',
                // hide: 'hovers',
                cssClass: 'card',
                position: 'top',
                // autoadjust: true,
                template:
                '<div class="arrow"></div>' +
                ' <div class="sigma-tooltip-header">{{label}}</div>' +
                '  <div class="sigma-tooltip-body">' +
                '    <table>' +
                '      <tr><th>id</th> <td>{{id}}</td></tr>' +
                '      <tr><th>frequency</th> <td>{{data.frequency}}</td></tr>' +
                '      <tr><th>score</th> <td>{{data.score}}</td></tr>' +
                '      <tr><th>spread</th> <td>{{data.spread}}</td></tr>' +
                '      <tr><th>value</th> <td>{{data.value}}</td></tr>' +
                '      <tr><th>size</th> <td>{{size}}</td></tr>' +
                '    </table>' +
                '  </div>' +
                '  <div class="sigma-tooltip-footer">Number of connections: {{degree}}</div>',
                renderer: function(node, template) {
                    // The function context is s.graph
                    node.degree = this.degree(node.id);

                    // Returns an HTML string:
                    return Mustache.render(template, node);

                    // Returns a DOM Element:
                    //var el = document.createElement('div');
                    //return el.innerHTML = Mustache.render(template, node);
                }
            }, {
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
            }],
            stage: {
                template:
                '<div class="arrow"></div>' +
                '<div class="sigma-tooltip-header"> Menu </div>'
            }
        };
        var tooltips = sigmajs.sigma.plugins.tooltips(s, s.renderers[0], tooltipConfig);
    }

    render() {
        return (
            <div>
                <div id="graph" style={{width: '100%', height: '700px'}} ref={(element) => this.createGraph(element)} />
            </div>
        );
    }
}