import * as Uint8Parser from './parser.uint8.js'

export const parse = (stream, schema, result = {}, parent = result) => {
  schema.forEach(partSchema => parsePart(stream, partSchema, result, parent))
}

const parsePart = (stream, schema, result, parent) => {
  if (typeof schema === 'function') {
    return schema(stream, result, parent, parsePart)
  }

  const key = Object.keys(schema)[0]
  if (Array.isArray(schema[key])) {
    parent[key] = {}
    parse(stream, schema[key], result, parent[key])
  } else if (typeof schema[key] === 'function') {
    schema[key](stream, result, parent, key, parsePart)
  } else {
    parent[key] = schema[key](stream, result, parent)
  }
}

export const conditional = (schema, conditionFunc) => (
  stream,
  result,
  parent,
  parsePart
) => {
  if (conditionFunc(stream, result, parent)) {
    parsePart(stream, schema, result, parent)
  }
}

export const loop = (schema, continueFunc) => (
  stream,
  result,
  parent,
  key,
  parsePart
) => {
  parent[key] = []
  while (continueFunc(stream, result, parent)) {
    const newParent = {}
    parsePart(stream, schema, result, newParent)
    result[key].push(newParent)
  }
}

export { Uint8Parser }
