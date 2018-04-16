
import { select } from 'd3-selection';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
} from '@redsift/d3-rs-theme';


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

      let sh = height || Math.round(width * DEFAULT_ASPECT);
      
      
      // SVG element
      let sid = null;
      if (id) sid = 'svg-' + id;

      let root = svg(sid)
                  .width(width).height(sh).margin(margin).scale(scale)
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
      
      // start chart - TODO
      console.log("my chart", w, h, data);
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