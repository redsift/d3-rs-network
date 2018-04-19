/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { event, select } from 'd3-selection';
import { drag, forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-selection';
import { html as svg } from '@redsift/d3-rs-svg';
import { presentation10, display} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 400;
const DEFAULT_ASPECT = 0.5;
const DEFAULT_MARGIN = 8;
const BASE_SIZE_GRANDFATHER_NODE = 50;
const BASE_SIZE_FATHER_NODE = 20;
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
    category = null,
    textDisplay = (d) => d.id,
    linkWidthParameter = (d) => Math.sqrt(d.value),
    tryGetChildren = null,
    tryGetParent = null,
    tryGetIndexBrothers = null,
    tryGetNumberOfBrothers = null;

  // TODO Function to create tree structure out of the other one created 
  function createTreeStructure(dataNodeLink){
    var res = {};

    return res;
  }
  function addTextForIDtextNode(d){
    return "text"+d.id;
  }

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

      // -------- PACKING FORCE TODO FIX BUG, we should be able to call it without d3.pack
      console.log("sw - 4: "+(sw - 4)+", sh - 4: "+(sh - 4));
      // var pack = pack().size([sw - 4, sh - 4]);

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
        .attr("id", d=>  d.id)
        .attr("class", d => d.strata)
        .attr("fill", function(d){
          if (d.strata == 0) {
            return 'red';
          } else if (d.strata == 1) {
            return 'green';
          } else if (d.strata == 2) {
            return 'blue';
          }
        })
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

      let textNode = nodeEnter
        .append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text( textDisplay )
        .attr("id", addTextForIDtextNode)
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

      var link = nodeEnter.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", linkWidthParameter )
        .attr("idSource", d=> ( d.source) )
        .attr("idTarget", d=> (d.target) )
        ;

      // ---- FORCE SETUP
      var simulation = forceSimulation(data.nodes)
        .force("link", forceLink().id(function (d) { return d.id; }))
        .force("charge", forceManyBody().strength(-500))
        .force("center", forceCenter(sw / 2, sh / 2))
        .force('collision', forceCollide().radius(function (d) {
          return d.radius
        }))
      ;

      simulation.force("link")
        .links(data.links)
        .strength (function (d) {
          // return Math.sqrt(d.value)
          return .05;
        })
        ;

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
                var r = 20 / d.strata;
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
            return select("#"+(d.source.id))._groups[0][0].cx.animVal.value;
          })
          .attr("y1", function (d) { 
            return select("#"+(d.source.id))._groups[0][0].cy.animVal.value;
          })
          .attr("x2", function (d) { 
            return select("#"+(d.target.id))._groups[0][0].cx.animVal.value;
          })
          .attr("y2", function (d) { 
            return select("#"+(d.target.id))._groups[0][0].cy.animVal.value;
          })
        ;

        textNode
          .transition().duration(10)
          .attr("x", function (d) {
            var circleValue = select("#" + d.id)._groups[0][0].cx.animVal.value;
            var circleWidth = select("#" + d.id)._groups[0][0].r.animVal.value;
            var txt = (d.friendlyName) ? (d.friendlyName ) : d.id;
            var txtLength = Number(select("#text"+d.id)._groups[0][0].textLength.baseVal.valueAsString);
            var newX = ( circleValue + txtLength >= sw )? ( circleValue-txtLength ) : circleValue;
            return newX;
          })
          .attr("y", function (d) { 
            return select("#" +d.id)._groups[0][0].cy.animVal.value; 
          })
        ;

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

  _impl.textDisplay = function (value) {
    return arguments.length ? (textDisplay = value, _impl) : textDisplay;
  };

  _impl.linkWidthParameter = function (value) {
    return arguments.length ? (linkWidthParameter = value, _impl) : linkWidthParameter;
  };


  return _impl;

}