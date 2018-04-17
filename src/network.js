
import { select } from 'd3-selection';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
} from '@redsift/d3-rs-theme';
import { link } from 'fs';


const DEFAULT_SIZE = 400;
const DEFAULT_ASPECT = 0.5;
const DEFAULT_MARGIN = 8;

export default function chart(id) {
  let classed = 'chart-network', 
      background = undefined,
      width = DEFAULT_SIZE,
      theme = 'light',
      height = null,
      margin = DEFAULT_MARGIN,
      style = undefined,
      scale = 1.0;

  
  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);
  
    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }

    selection.each(function() {
      let node = select(this);  
      let data = node.datum() || [];
      //let sh = height || Math.round(width * DEFAULT_ASPECT);4
      let sw = 800;
      let sh = 600 ;
      
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
        _style = [ _impl ].filter(c => c != null).reduce((p, c) => p + c.defaultStyle(theme, w), '');
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
      // ---- FORCE SETUP
      var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(sw / 2, sh / 2))
        ;
      
      let nodeEnter = d3.select(".chart-network");
      let nodes = [], 
          mac=[],
          ip=[],
          relationshipsGuidToMac=[],
          relationshipsMacToIp=[],
          links = []; 

      nodes = data.nodes, mac=data.mac, ip=data.ip, relationshipsGuidToMac = data.relationshipsGuidToMac,
      relationshipsMacToIp=data.relationshipsMacToIp,links = data.links;

      console.log("nodeEnter: "); console.log(nodeEnter);
      console.log("nodes: "); console.log(nodes);
      console.log("mac: "); console.log(mac);
      console.log("ip: "); console.log(ip);
      console.log("relationshipsMacToIp: "); console.log(relationshipsMacToIp);
      console.log("links: "); console.log(links);

      // test
      var ips = tryGetChildren("mac_32_64_23_34");
      console.log("ips: "); console.log(ips);

      // guid circle
      let nodeCircle = nodeEnter.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
          .attr("id", d => d.id )
          .attr("class", function(d) { 
            if (d.id.includes("ip")) { return "ipCircle" } 
            else if (d.id.includes("mac")) {return "macCircle" }
            return "guidCircle"; 
          })
          .attr("r", function(d){ if (d.id.includes("guid")) {return 20} 
            else if (d.id.includes("mac")) {return 5} 
            return 2; })
          .on("click", function(d){
            console.log("clicked on d: "); console.log(d);
            console.log("tryGetChildren: "); console.log(tryGetChildren(d.id));
          })
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        
      // mac circle
      let macCircle = nodeEnter.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(mac)
      .enter().append("circle")
        .attr("fill",  0 )
        .attr("id", d => d.id )
        .attr("class", function(d) { 
          if (d.id.includes("ip")) { return "ipCircle" } 
          else if (d.id.includes("mac")) {return "macCircle" }
          return "guidCircle"; 
        })
        .attr("r", function(d){ if (d.id.includes("guid")) {return 10} 
          else if (d.id.includes("mac")) {return 5} 
          return 2; })
        .on("click", function(d){
          console.log("clicked on d: "); console.log(d);
          console.log("tryGetChildren: "); console.log(tryGetChildren(d.id));
        })
        .on("tick", function(d){
          console.log("tick from mac");
        })
      ;

      // ip circle
      let ipCircle = nodeEnter.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(ip)
      .enter().append("circle")
        .attr("fill",  0 )
        .attr("id", d => d.id )
        .attr("class", function(d) { 
          if (d.id.includes("ip")) { return "ipCircle" } 
          else if (d.id.includes("mac")) {return "macCircle" }
          return "guidCircle"; 
        })
        .attr("r", function(d){ if (d.id.includes("guid")) {return 10} 
          else if (d.id.includes("mac")) {return 5} 
          return 2; })
        .on("click", function(d){
          console.log("clicked on d.id: "); console.log(d.id);
          console.log("tryGetParent circle: "); 
          console.log(tryGetParent(d.id));
        })
        ;

      let textNode = nodeEnter
       .append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(function(d) { return d.id; })
        .attr("id", d => d.id)
        .attr("class", "textNetwork")
        .attr("class", function(d) { 
          if (d.id.includes("ip")) { return "ipText" } 
          else if (d.id.includes("mac")) {return "macText" }
          return "guidText";
        })
        .on("mouseover", function (d){
          console.log("mouseover, this is: ");console.log(this );
          console.log("mouseover, d3.select(this) is: ");console.log(d3.select(this) );
          d3.select(this)._groups[0][0].style.fill = "black";
        })
        .on("mouseout", function (d){
          // console.log("mouseout, this is: ");console.log(this );
          // console.log("mouseout, d3.select(this) is: ");console.log(d3.select(this) );
          d3.select(this)._groups[0][0].style.fill = "";
        })
        .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))    
        ;

        let textMac = nodeEnter
        .append("g")
         .selectAll("text")
         .data(mac)
         .enter().append("text")
         .text(function(d) { return d.id; })
         .attr("id", d => d.id)
         .attr("class", "textNetwork")
         .attr("class", function(d) { 
           if (d.id.includes("ip")) { return "ipText" } 
           else if (d.id.includes("mac")) {return "macText" }
           return "guidText";
         })
         .on("mouseover", function (d){
           d3.select(this)._groups[0][0].style.fill = "black";
         })
         .on("mouseout", function (d){
           d3.select(this)._groups[0][0].style.fill = "";
         })
         .call(d3.drag()
         .on("start", dragstarted)
         .on("drag", dragged)
         .on("end", dragended))    
         ;
 

      var link = nodeEnter.append("g")
          .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
          .attr("stroke-width", function(d,i) { return Math.sqrt(d.value); })
        ;

      simulation
        .nodes(data.nodes)
        .on("tick", ticked)        
        ;        
    
      simulation.force("link")
        .links(data.links);    

      function ticked() {
        link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

        nodeCircle
          .attr("cx", function(d) { 
            return d.x = Math.max(this.r.animVal.value, Math.min(sw - this.r.animVal.value, d.x)); })
          .attr("cy", function(d) { return d.y = 
            Math.max(this.r.animVal.value, Math.min(sh - this.r.animVal.value, d.y)); })        

        macCircle
          .attr("cx", function(d){
            var idParent = tryGetParent(d.id);
            // console.log("macCircle idParent: "+idParent);
            return d3.select("#"+idParent)._groups[0][0].cx.animVal.value;
          })
          .attr("cy", function(d){
            var idParent = tryGetParent(d.id);
            // console.log("macCircle idParent: "+idParent);
            return d3.select("#"+idParent)._groups[0][0].cy.animVal.value;
          })

        textNode
          .attr("x", function(d) { 
            return d3.select("#"+d.id)._groups[0][0].cx.animVal.value ; } )
          .attr("y", function(d) { return d3.select("#"+d.id)._groups[0][0].cy.animVal.value ; } )
      
          textMac
          .attr("x", function(d) { 
            return d3.select("#"+d.id)._groups[0][0].cx.animVal.value ; } )
          .attr("y", function(d) { return d3.select("#"+d.id)._groups[0][0].cy.animVal.value ; } )
          
        }


      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;        
      }
      
      function dragged(d) {
        d.fx = Math.max(10, Math.min(sw -10, d3.event.x));
        d.fy = Math.max(10, Math.min(sh-10, d3.event.y));
      }
      
      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }); 
    
  


  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = () => `
      ${_impl.self()} { 
        shape-rendering: geometricprecision;
      }
    `;
  
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };
  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };
  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };
  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 
  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 
  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   
  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 
  return _impl;
}