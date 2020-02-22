"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Uint8Parser = exports.loop = exports.conditional = exports.parse = void 0;

var Uint8Parser = _interopRequireWildcard(require("./parser.uint8.js"));

exports.Uint8Parser = Uint8Parser;

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var parse = function parse(stream, schema) {
  var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : result;
  schema.forEach(function (partSchema) {
    return parsePart(stream, partSchema, result, parent);
  });
};

exports.parse = parse;

var parsePart = function parsePart(stream, schema, result, parent) {
  if (typeof schema === 'function') {
    return schema(stream, result, parent, parsePart);
  }

  var key = Object.keys(schema)[0];

  if (Array.isArray(schema[key])) {
    parent[key] = {};
    parse(stream, schema[key], result, parent[key]);
  } else if (typeof schema[key] === 'function') {
    schema[key](stream, result, parent, key, parsePart);
  } else {
    parent[key] = schema[key](stream, result, parent);
  }
};

var conditional = function conditional(schema, conditionFunc) {
  return function (stream, result, parent, parsePart) {
    if (conditionFunc(stream, result, parent)) {
      parsePart(stream, schema, result, parent);
    }
  };
};

exports.conditional = conditional;

var loop = function loop(schema, continueFunc) {
  return function (stream, result, parent, key, parsePart) {
    parent[key] = [];

    while (continueFunc(stream, result, parent)) {
      var newParent = {};
      parsePart(stream, schema, result, newParent);
      result[key].push(newParent);
    }
  };
};

exports.loop = loop;