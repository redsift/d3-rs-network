# d3-rs-network

[![Circle CI](https://img.shields.io/circleci/project/redsift/d3-rs-network.svg?style=flat-square)](https://circleci.com/gh/redsift/d3-rs-network)
[![npm](https://img.shields.io/npm/v/@redsift/d3-rs-network.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/d3-rs-network)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/d3-rs-network/master/LICENSE)

`d3-rs-network` 

## Usage

### Browser

    <script src="//static.redsift.io/reusable/d3-rs-network/latest/d3-rs-network.umd-es2015.min.js"></script>
    <script>
      let VIZ = {
      "nodes": [
        { id: "grandparent1", strata: 0 },
        {id: "parent1", strata: 1},
        {id: "child1", strata: 2},
        {id: "child2", strata: 2},
        {id: "child3", strata: 2, friendlyName: "napoleon"},
        {id: "child4", strata: 2},
        { id: "grandparent2", strata: 0 }
        // ...
      ],
      "links": [
        { source: "grandparent1", target: "grandparent2", value: 40, color: 'red' },
        { source: "child1", target: "child3", value: 10.34, color: 'red' },
        { source: "child2", target: "child3", value: 10.34, color: 'red' }
        // ...
      ],
      "owns": [
        { parent: "grandparent1", child: "parent1" },
        { parent: "parent1", child: "child1" },
        { parent: "parent1", child: "child2" },
        // ...
      ]
      };

      var chart = d3_rs_network.html('blank').category(category)
      .tryGetChildren(tryGetChildren).tryGetParent(tryGetParent)
      .tryGetIndexBrothers(tryGetIndexBrothers).tryGetNumberOfBrothers(tryGetNumberOfBrothers)
      .textDisplay(textDisplay)
      ;

      d3.select('body').datum(VIZ).call(chart);
    </script>

### ES6

    import { html as chart } from "@redsift/d3-rs-network";
    let eml = chart();
    ...

### Require

    var chart = require("@redsift/d3-rs-network");
    var eml = chart.html();
    ...

### TODO
Additional functions for customisation of the visualizations.
    - Size of circles depending of given parameter as input
    - Color of circles depending on strata
    - Width of lines depending of given parameter as input
    - Color of lines depending of given parameter as input
    - Saturation of lines depending of given parameter as input
    - Possibility to display different hierarchy of links 