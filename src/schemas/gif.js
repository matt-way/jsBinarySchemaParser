import { conditional, loop } from '../'
import {
  readByte,
  peekByte,
  readBytes,
  peekBytes,
  readString,
  readUnsigned,
  readArray,
  readBits,
} from '../parsers/uint8'

// a set of 0x00 terminated subblocks
var subBlocksSchema = {
  blocks: (stream) => {
    const terminator = 0x00
    const chunks = []
    const streamSize = stream.data.length
    var total = 0
    for (
      var size = readByte()(stream);
      size !== terminator;
      size = readByte()(stream)
    ) {
      // size becomes undefined for some case when file is corrupted and  terminator is not proper 
      // null check to avoid recursion
      if(!size) break;
      // catch corrupted files with no terminator
      if (stream.pos + size >= streamSize) {
        const availableSize = streamSize - stream.pos
        chunks.push(readBytes(availableSize)(stream))
        total += availableSize
        break
      }
      chunks.push(readBytes(size)(stream))
      total += size
    }
    const result = new Uint8Array(total)
    var offset = 0
    for (var i = 0; i < chunks.length; i++) {
      result.set(chunks[i], offset)
      offset += chunks[i].length
    }
    return result
  },
}

// global control extension
const gceSchema = conditional(
  {
    gce: [
      { codes: readBytes(2) },
      { byteSize: readByte() },
      {
        extras: readBits({
          future: { index: 0, length: 3 },
          disposal: { index: 3, length: 3 },
          userInput: { index: 6 },
          transparentColorGiven: { index: 7 },
        }),
      },
      { delay: readUnsigned(true) },
      { transparentColorIndex: readByte() },
      { terminator: readByte() },
    ],
  },
  (stream) => {
    var codes = peekBytes(2)(stream)
    return codes[0] === 0x21 && codes[1] === 0xf9
  }
)

// image pipeline block
const imageSchema = conditional(
  {
    image: [
      { code: readByte() },
      {
        descriptor: [
          { left: readUnsigned(true) },
          { top: readUnsigned(true) },
          { width: readUnsigned(true) },
          { height: readUnsigned(true) },
          {
            lct: readBits({
              exists: { index: 0 },
              interlaced: { index: 1 },
              sort: { index: 2 },
              future: { index: 3, length: 2 },
              size: { index: 5, length: 3 },
            }),
          },
        ],
      },
      conditional(
        {
          lct: readArray(3, (stream, result, parent) => {
            return Math.pow(2, parent.descriptor.lct.size + 1)
          }),
        },
        (stream, result, parent) => {
          return parent.descriptor.lct.exists
        }
      ),
      { data: [{ minCodeSize: readByte() }, subBlocksSchema] },
    ],
  },
  (stream) => {
    return peekByte()(stream) === 0x2c
  }
)

// plain text block
const textSchema = conditional(
  {
    text: [
      { codes: readBytes(2) },
      { blockSize: readByte() },
      {
        preData: (stream, result, parent) =>
          readBytes(parent.text.blockSize)(stream),
      },
      subBlocksSchema,
    ],
  },
  (stream) => {
    var codes = peekBytes(2)(stream)
    return codes[0] === 0x21 && codes[1] === 0x01
  }
)

// application block
const applicationSchema = conditional(
  {
    application: [
      { codes: readBytes(2) },
      { blockSize: readByte() },
      { id: (stream, result, parent) => readString(parent.blockSize)(stream) },
      subBlocksSchema,
    ],
  },
  (stream) => {
    var codes = peekBytes(2)(stream)
    return codes[0] === 0x21 && codes[1] === 0xff
  }
)

// comment block
const commentSchema = conditional(
  {
    comment: [{ codes: readBytes(2) }, subBlocksSchema],
  },
  (stream) => {
    var codes = peekBytes(2)(stream)
    return codes[0] === 0x21 && codes[1] === 0xfe
  }
)

const schema = [
  { header: [{ signature: readString(3) }, { version: readString(3) }] },
  {
    lsd: [
      { width: readUnsigned(true) },
      { height: readUnsigned(true) },
      {
        gct: readBits({
          exists: { index: 0 },
          resolution: { index: 1, length: 3 },
          sort: { index: 4 },
          size: { index: 5, length: 3 },
        }),
      },
      { backgroundColorIndex: readByte() },
      { pixelAspectRatio: readByte() },
    ],
  },
  conditional(
    {
      gct: readArray(3, (stream, result) =>
        Math.pow(2, result.lsd.gct.size + 1)
      ),
    },
    (stream, result) => result.lsd.gct.exists
  ),
  // content frames
  {
    frames: loop(
      [gceSchema, applicationSchema, commentSchema, imageSchema, textSchema],
      (stream) => {
        var nextCode = peekByte()(stream)
        // rather than check for a terminator, we should check for the existence
        // of an ext or image block to avoid infinite loops
        //var terminator = 0x3B;
        //return nextCode !== terminator;
        return nextCode === 0x21 || nextCode === 0x2c
      }
    ),
  },
]

export default schema
