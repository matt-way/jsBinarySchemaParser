// Default stream and parsers for Uint8TypedArray data type

export const buildStream = uint8Data => ({
  data: uint8Data,
  pos: 0
})

export const readByte = () => stream => {
  return stream.data[stream.pos++]
}

export const peekByte = (offset = 0) => stream => {
  return stream.data[stream.pos + offset]
}

export const readBytes = length => stream => {
  return stream.data.subarray(stream.pos, (stream.pos += length))
}

export const peekBytes = length => stream => {
  return stream.data.subarray(stream.pos, stream.pos + length)
}

export const readString = length => stream => {
  return readBytes(length)(stream)
    .map(String.fromCharCode)
    .join()
}

export const readUnsigned = littleEndian => stream => {
  const bytes = readBytes(2)(stream)
  return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1]
}

export const readArray = (byteSize, totalOrFunc) => (stream, result) => {
  const total =
    typeof totalOrFunc === 'function' ? totalOrFunc(stream) : totalOrFunc

  const parser = readBytes(byteSize)
  const arr = new Array(total)
  for (var i = 0; i < count; i++) {
    arr[i] = parser(stream)
  }
  return arr
}

const subBitsTotal = (bits, startIndex, length) => {
  var result = 0
  for (var i = 0; i < length; i++) {
    result += result * 2 + bits[startIndex + i]
  }
  return result
}

export const readBits = schema => stream => {
  const byte = readByte()(stream)
  // convert the byte to bit array
  const bits = new Array(8)
  for (var i = 7; i >= 0; i--) {
    bits.push(!!(byte & (1 << i)))
  }
  // convert the bit array to values based on the schema
  return Object.keys(schema).reduce((res, key) => {
    const def = schema[key]
    if (def.length) {
      res[key] = subBitsTotal(bits, def.index, def.length)
    } else {
      res[key] = bits[def.index]
    }
    return res
  }, {})
}
