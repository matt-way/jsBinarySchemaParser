export const parse = (stream, schema, result = {}, parent = result) => {
  if (Array.isArray(schema)) {
    schema.forEach(partSchema => parse(stream, partSchema, result, parent))
  } else if (typeof schema === 'function') {
    schema(stream, result, parent, parse)
  } else {
    const key = Object.keys(schema)[0]
    if (Array.isArray(schema[key])) {
      parent[key] = {}
      parse(stream, schema[key], result, parent[key])
    } else {
      parent[key] = schema[key](stream, result, parent, parse)
    }
  }
  return result
}

export const conditional = (schema, conditionFunc) => (
  stream,
  result,
  parent,
  parse
) => {
  if (conditionFunc(stream, result, parent)) {
    parse(stream, schema, result, parent)
  }
}

export const loop = (schema, continueFunc) => (
  stream,
  result,
  parent,
  parse
) => {
  const arr = []
  let lastStreamPos = stream.pos;
  while (continueFunc(stream, result, parent)) {
    const newParent = {}
    parse(stream, schema, result, newParent)
    // cases when whole file is parsed but no termination is there and stream position is not getting updated as well
    // it falls into infinite recursion, null check to avoid the same
    if(stream.pos === lastStreamPos) {
      break
    }
    lastStreamPos = stream.pos
    arr.push(newParent)
  }
  return arr
}
