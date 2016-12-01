/*import { createElement, ClassAttributes } from 'react';
import * as ReactDOM from 'react-dom';

import { Workspace, WorkspaceProps, DemoDataProvider } from '../index';
*/
var data = require("./relatedGraph.json")

var sigma = require("linkurious")
require("imports-loader?sigma=linkurious,this=>window!linkurious/dist/plugins")

var Mustache = require("mustache")
var _ = require("lodash")

document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    /*fetch("related/patient").then(function(response) {
        console.log(response.json);
    });*/
    
    var g = {
      nodes: [],
      edges: []
    };
    var stopNodes = [0];//[0, 871, 213, 1059]
    _.each(data.graph.nodes, node => {
      if (!_.includes(stopNodes, node.id)) {
        g.nodes.push({
          id: node.id,
          label: node.label + ' ' + node.id,
          x: Math.random(),
          y: Math.random(),
          size: node.entities.frequency / 1000,
          color: '#aaa',
          data: node.entities[0]
        })
      }
    });

    var colors = {related: '#ff0000', similar: '#0000FF'};

    _.each(data.graph.edges, edge => {
      if (!(_.includes(stopNodes, edge.origin) || _.includes(stopNodes, edge.destination))) {
        g.edges.push({
          id: 'e' + edge.origin + 'to' + edge.destination,
          source: edge.origin,
          target: edge.destination,      
          /*size: Math.random(),*/
          color: colors[edge.type]
        });
      }
    });

    // Instantiate sigma:
    var s = new sigma({
      graph: g,
      container: 'root'
    });
     
    var fa = s.startForceAtlas2({worker: true, scalingRatio: 100, gravity: 1, barnesHutOptimize: true, adjustSizes: false, strongGravityMode: true});
    window.setTimeout(function() {s.stopForceAtlas2()}
      , 2000);

    var tooltipConfig = {
      node: [{
        show: 'hovers',
        hide: 'hovers',
        cssClass: 'sigma-tooltip',
        position: 'top',
        //autoadjust: true,
        template:
        '<div class="arrow"></div>' +
        ' <div class="sigma-tooltip-header">{{label}}</div>' +
        '  <div class="sigma-tooltip-body">' +
        '    <table>' +
        '      <tr><th>frequency</th> <td>{{data.frequency}}</td></tr>' +
        '      <tr><th>score</th> <td>{{data.score}}</td></tr>' +
        '      <tr><th>spread</th> <td>{{data.spread}}</td></tr>' +
        '      <tr><th>value</th> <td>{{data.value}}</td></tr>' +
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
  var tooltips = sigma.plugins.tooltips(s, s.renderers[0], tooltipConfig);
    /*var props = {        
        ref: function(browser) {
            // if you reuse this code you should check for workspace to be null on unmount
            if (browser) {
                const model = workspace.getModel();
                model.graph.on('action:iriClick', (iri: string) => {
                    console.log(iri);
                });
                model.importLayout({
                    dataProvider: new DemoDataProvider(),
                    preloadedElements: {},
                    preloadedLinks: [],
                    layoutData: undefined,
                });
            }
        },
    };

    ReactDOM.render(createElement(Workspace, props), container);
    */
});