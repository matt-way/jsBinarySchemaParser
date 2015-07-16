// export wrapper for exposing library

var BSP = window.BSP || {};

BSP.DataParser = require('./dataparser');
BSP.Parsers = require('./parsers');

window.BSP = BSP;