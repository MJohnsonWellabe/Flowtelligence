(function () {
  'use strict';
  // Lowtech brand colors — always applied, no theme picker
  var Lowtech_VARS = {
    '--navy':       '#0B1C2C',
    '--navy-mid':   '#0C3B4F',
    '--navy-light': '#0C3B4F',
    '--aqua':       '#12B5CC',
    '--aqua-light': '#2DC8DE',
    '--aqua-pale':  '#E6F9FC',
    '--gold':       '#FFC220',
    '--gold-lt':    '#FFD84D'
  };
  Object.keys(Lowtech_VARS).forEach(function(v) {
    document.documentElement.style.setProperty(v, Lowtech_VARS[v]);
  });
})();
