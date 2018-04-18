/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

import { select } from 'd3-selection';
import { drag, forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-selection';
import { event } from 'd3-selection';
import { html as svg } from '@redsift/d3-rs-svg';
import {
  presentation10,
  display,
} from '@redsift/d3-rs-theme';
import { link } from 'fs';

// >npm install --save d3-forceSimulation

const DEFAULT_SIZE = 400;
const DEFAULT_ASPECT = 0.5;
const DEFAULT_MARGIN = 8;
const BASE_SIZE_GRANDFATHER_NODE = 50;
const BASE_SIZE_FATHER_NODE = 30;
const BASE_SIZE_CHILD_NODE = 5;

export default function chart(id) {
  let classed = 'chart-network',
    background = undefined,
    width = DEFAULT_SIZE,
    theme = 'light',
    height = null,
    margin = DEFAULT_MARGIN,
    style = undefined,
    scale = 1.0,
    category = null;

  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
      transition = (context.selection !== undefined);

    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }

    selection.each(function () {
      let node = select(this);
      let data = node.datum() || [];
      //let sh = height || Math.round(width * DEFAULT_ASPECT);4
      let sw = 800;
      let sh = 600;

      // SVG element
      let sid = null;
      if (id) sid = 'svg-' + id;

      let root = svg(sid)
        .width(sw).height(sh).margin(margin).scale(scale)
        .background(_background);
      let tnode = node;
      if (transition === true) {
        tnode = node.transition(context);
      }

      let w = root.childWidth(),
        h = root.childHeight();
      let _style = style;
      if (_style === undefined) {
        // build a style sheet from the embedded charts
        _style = [_impl].filter(c => c != null).reduce((p, c) => p + c.defaultStyle(theme, w), '');
      }

      root.style(_style);
      tnode.call(root);

      let snode = node.select(root.self());
      let elmS = snode.select(root.child());

      let g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
      }

      // -------- NETWORK CHART
      console.log("my chart", w, h, data);

      let nodeEnter = select(".chart-network");
      let nodes = [],
        links = [],
        owns = [];

      nodes = data.nodes, links = data.links, owns = data.owns;

      console.log("nodeEnter: "); console.log(nodeEnter);
      console.log("nodes: "); console.log(nodes);
      console.log("links: "); console.log(links);
      console.log("owns: "); console.log(owns);

      // guid circle
      let nodeCircle = nodeEnter.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("id", d => d.id)
        .attr("class", d => d.strata)
        .attr("r", function (d) {
          if (d.strata == 0) {
            return BASE_SIZE_GRANDFATHER_NODE;
          } else if (d.strata == 1) {
            return BASE_SIZE_FATHER_NODE;
          } else if (d.strata == 2) {
            return BASE_SIZE_CHILD_NODE;
          }
        })
        .on("click", function (d) {
          console.log("clicked on d: "); console.log(d);
          console.log("tryGetChildren: "); console.log(tryGetChildren(d.id));
        })
        .call(drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        ;

      // mac circle
      // let macCircle = nodeEnter.append("g")
      //   .attr("class", "nodes")
      //   .selectAll("circle")
      //   .data(mac)
      //   .enter().append("circle")
      //   .attr("fill", 0)
      //   .attr("id", d => d.id)
      //   .attr("class",  "macCircle")
      //   .attr("r", d => d.numChildren * 3 + 5 )
      //   .on("click", function (d) {
      //     console.log("clicked on d: "); console.log(d);
      //     console.log("tryGetChildren: "); console.log(tryGetChildren(d.id));
      //   })
      //   .on("tick", function (d) {
      //     console.log("tick from mac");
      //   })
      //   ;
      // ip circle
      // let ipCircle = nodeEnter.append("g")
      //   .attr("class", "nodes")
      //   .selectAll("circle")
      //   .data(ip)
      //   .enter().append("circle")
      //   .attr("fill", 0)
      //   .attr("id", d => d.id)
      //   .attr("class", "ipCircle" )
      //   .attr("r",  2 )
      //   .attr("cx", function (d) {
      //     return Math.random() * 300;
      //   })
      //   .attr("cy", function (d) {
      //     return Math.random() * 300;
      //   })
      //   .on("click", function (d) {
      //     console.log("clicked on d.id: "); console.log(d.id);
      //     console.log("tryGetParent circle: ");
      //     console.log(tryGetParent(d.id));
      //   })
      //   ;

      let textNode = nodeEnter
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(function (d) { return d.id; })
        .attr("id", d => d.id)
        .attr("class", "textNetwork")
        .attr("class", (d) => d.strata)
        .on("mouseover", function (d) {
          select(this)._groups[0][0].style.fill = "black";
        })
        .on("mouseout", function (d) {
          select(this)._groups[0][0].style.fill = "";
        })
        .call(drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        ;



      // let textMac = nodeEnter
      //   .append("g")
      //   .selectAll("text")
      //   .data(mac)
      //   .enter().append("text")
      //   .text(function (d) { return d.id; })
      //   .attr("id", d => d.id)
      //   .attr("class", "textNetwork")
      //   .attr("class", function (d) {
      //     if (d.id.includes("ip")) { return "ipText" }
      //     else if (d.id.includes("mac")) { return "macText" }
      //     return "guidText";
      //   })
      //   .on("mouseover", function (d) {
      //     select(this)._groups[0][0].style.fill = "black";
      //   })
      //   .on("mouseout", function (d) {
      //     select(this)._groups[0][0].style.fill = "";
      //   })
      //   .call(drag()
      //     .on("start", dragstarted)
      //     .on("drag", dragged)
      //     .on("end", dragended))
      //   ;


      var link = nodeEnter.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", function (d, i) { return Math.sqrt(d.value); })
        .attr("idSource", d => d.source)
        .attr("idTarget", d => d.target)
        ;

      // ---- FORCE SETUP
      var simulation = forceSimulation(data.nodes)
        .force("link", forceLink().id(function (d) { return d.id; }))
        .force("charge", forceManyBody().strength(-200))
        .force("center", forceCenter(sw / 2, sh / 2))
        .force('collision', d3.forceCollide().radius(function (d) {
          console.log("collision d"); console.log(d);
          return d.radius
        }))
      ;

      simulation.force("link")
      .links(data.links);

      simulation
        .nodes(data.nodes)
        .on("tick", ticked)
        ;

      function ticked() {
        nodeCircle
          .attr("cx", function (d) {
            if (d.strata == 0) {
              return d.x = Math.max(this.r.animVal.value, Math.min(sw - this.r.animVal.value, d.x));
            } else if (d.strata == 1 || d.strata == 2) {
              var idParent = tryGetParent(d.id);
              if (idParent != null) {
                var parentCenterX = select("#" + idParent)._groups[0][0].cx.animVal.value;
                var r = 20 / d.strata;
                var posIndex = tryGetIndexBrothers(d.id);
                var numBrothers = tryGetNumberOfBrothers(d.id);
                var angleInDegrees = posIndex / numBrothers * 360;
                var angleInRadians = angleInDegrees * (2 * Math.PI / 360);
                var cosTheta = Math.cos(angleInRadians);
                var sinTheta = Math.sin(angleInRadians);
                var possible_cx = parentCenterX + cosTheta * r;
                return possible_cx;
              }
              return d.x = Math.max(this.r.animVal.value, Math.min(sw - this.r.animVal.value, d.x));
            }
          })
          .attr("cy", function (d) {
            if (d.strata == 0) {
              return d.y = Math.max(this.r.animVal.value, Math.min(sh - this.r.animVal.value, d.y));
            } else if (d.strata == 1 || d.strata == 2) {
              var idParent = tryGetParent(d.id);

              if (idParent != null) {
                var parentCenterY = select("#" + idParent)._groups[0][0].cy.animVal.value;
                var r = 10 / d.strata;
                var posIndex = tryGetIndexBrothers(d.id);
                var numBrothers = tryGetNumberOfBrothers(d.id);
                var angleInDegrees = posIndex / numBrothers * 360;
                var angleInRadians = angleInDegrees * (2 * Math.PI / 360);
                var cosTheta = Math.cos(angleInRadians);
                var sinTheta = Math.sin(angleInRadians);
                var possible_cy = parentCenterY + sinTheta * r;
                return possible_cy;
              }
              return d.y = Math.max(this.r.animVal.value, Math.min(sh - this.r.animVal.value, d.y));
            }
          })
          ;

        link
          .attr("x1", function (d) {
            return d3.select("#"+d.source.id)._groups[0][0].cx.animVal.value;
          })
          .attr("y1", function (d) { 
            return d3.select("#"+d.source.id)._groups[0][0].cy.animVal.value;
          })
          .attr("x2", function (d) { 
            return d3.select("#"+d.target.id)._groups[0][0].cx.animVal.value;
          })
          .attr("y2", function (d) { 
            return d3.select("#"+d.target.id)._groups[0][0].cy.animVal.value;
          })
        ;

        // macCircle
        //   .attr("cx", function (d) {
        //     var idParent = tryGetParent(d.id);
        //     return typeof idParent != 'undefined' ? select("#" + idParent)._groups[0][0].cx.animVal.value : select("#" + d.id)._groups[0][0].cx.animVal.value;
        //   })
        //   .attr("cy", function (d) {
        //     var idParent = tryGetParent(d.id);
        //     return typeof idParent != 'undefined' ? select("#" + idParent)._groups[0][0].cy.animVal.value : select("#" + d.id)._groups[0][0].cy.animVal.value;
        //   })

        // ipCircle
        //   .attr("cx", function (d) {
        //     var idParent = tryGetParent(d.id);
        //     // angle offset depends of the number of children, and the position as a children
        //     var r = 10;
        //     var angleInDegrees = Math.random() * 180;
        //     var angleInRadians = angleInDegrees * (Math.PI / 180);
        //     var cosTheta = Math.cos(angleInRadians);
        //     var sinTheta = Math.sin(angleInRadians);
        //     // var possible_cx = cosTheta * select("#" + idParent)._groups[0][0].cx.animVal.value - 
        //     //   sinTheta * select("#" + idParent)._groups[0][0].cy.animVal.value ;
        //     return typeof idParent != 'undefined' ?
        //       select("#" + idParent)._groups[0][0].cx.animVal.value + r * cosTheta
        //       //possible_cx
        //       : select("#" + d.id)._groups[0][0].cx.animVal.value;
        //   })
        //   .attr("cy", function (d) {
        //     var idParent = tryGetParent(d.id);
        //     var r = 10;
        //     var angleInDegrees = Math.random() * 360;
        //     var angleInRadians = angleInDegrees * (2 * Math.PI / 360);
        //     var cosTheta = Math.cos(angleInRadians);
        //     var sinTheta = Math.sin(angleInRadians);

        //     return typeof idParent != 'undefined' ?
        //       select("#" + idParent)._groups[0][0].cy.animVal.value + r * sinTheta
        //       : select("#" + d.id)._groups[0][0].cy.animVal.value;
        //   });

        textNode
          .attr("x", function (d) {
            return select("#" + d.id)._groups[0][0].cx.animVal.value;
          })
          .attr("y", function (d) { return select("#" + d.id)._groups[0][0].cy.animVal.value; })

        // textMac
        //   .attr("x", function (d) {
        //     return select("#" + d.id)._groups[0][0].cx.animVal.value;
        //   })
        //   .attr("y", function (d) { return select("#" + d.id)._groups[0][0].cy.animVal.value; })

      }

      function dragstarted(d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = Math.max(10, Math.min(sw - 10, event.x));
        d.fy = Math.max(10, Math.min(sh - 10, event.y));
      }

      function dragended(d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    });

  }

  _impl.self = function () { return 'g' + (id ? '#' + id : '.' + classed); }

  _impl.id = function () {
    return id;
  };

  _impl.defaultStyle = () => `
      ${_impl.self()} { 
        shape-rendering: geometricprecision;
      }
    `;

  _impl.classed = function (value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
  _impl.background = function (value) {
    return arguments.length ? (background = value, _impl) : background;
  };
  _impl.theme = function (value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };
  _impl.size = function (value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
  _impl.width = function (value) {
    return arguments.length ? (width = value, _impl) : width;
  };
  _impl.height = function (value) {
    return arguments.length ? (height = value, _impl) : height;
  };
  _impl.scale = function (value) {
    return arguments.length ? (scale = value, _impl) : scale;
  };
  _impl.margin = function (value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };
  _impl.style = function (value) {
    return arguments.length ? (style = value, _impl) : style;
  };

  _impl.category = function (value) {
    return arguments.length ? (category = value, _impl) : category;
  };

  _impl.tryGetChildren = function (value) {
    return arguments.length ? (tryGetChildren = value, _impl) : tryGetChildren;
  };

  _impl.tryGetParent = function (value) {
    return arguments.length ? (tryGetParent = value, _impl) : tryGetParent;
  };
  _impl.tryGetIndexBrothers = function (value) {
    return arguments.length ? (tryGetIndexBrothers = value, _impl) : tryGetIndexBrothers;
  };
  _impl.tryGetNumberOfBrothers = function (value) {
    return arguments.length ? (tryGetNumberOfBrothers = value, _impl) : tryGetNumberOfBrothers;
  };

  return _impl;
}