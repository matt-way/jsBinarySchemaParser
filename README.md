# js Binary Schema Parser

Parse binary files in client javascript using clean schema objects. 

We needed this when building the **[Ruffle][1]** hybrid app, so that we could effectively parse GIF files for manipulation. While this readme describes how to parse binary files in general, our *[GIF Parser][2]* library exhibits a full use of this project (including a *[demo][2]*), which might be further help to anyone looking.

As we knew our compatibility requirements in advance, this parser expects the input file to be converted to a `Uint8Array` array. 

### How to Use

*Installation:*

    bower install --save js-binary-schema-parser

*Include in your app:*

    <script src="/bower_components/js-binary-schema-parser/dist/js-binary-schema-parser.min.js"></script>

*Create a schema and parse a file:*

    // optional included basic parsers
    var Parsers = BSP.Parsers;
    
    var schema = [
        // part definitions...
    ];
    
    // get the input file data
    var data = new Uint8Array(fileArrayBuffer);
    // create a parser object
    var file = new BSP.DataParser(data);
    // parse the file using your schema
    var parsedObject = file.parse(schema);
    
### Schemas

Schemas are an array of *parts*, which are objects containing particular keys and values defining how the next bytes in the file should be parsed. *Parts* can also contain other parts internally, and include syntax for loops, and bit parsing. You can also include your own custom functions for parsing, providing direct access to the data stream. Below is a list of all the available keys a part object can use, along with some examples:

*Keys:*

**label** - The name of the part used in the output object (required)

**requires** - A function that is provided the stream, and the output object, which can be used to determine whether or not this part should be parsed. - `function(stream, obj){}`
    
*Parser type keys (only one can be used per part):*

**parser** - A function used to extract the next valid content from the data stream. This library contains a Parsers object which houses the most commonly required parsers. They are:

- `readByte()` - Returns the next byte off the data stream
- `readBytes(n)` - Returns the *n* next bytes off the data stream
- `readString(length)` - Returns a string representation of the next *length* bytes off the data stream
- `readUnsigned(endian)` - Returns an unsigned int using the provided *endian*.
- `readrray(size, totalFunc)` - Returns an array of byte sets (sub-arrays) of size *size*. The *totalFunc* is used to determine the number of items in the set, and is provided the stream, and the output object. - `function(stream, obj){}`

The parser can also be a custom function that is provided the stream with which you can manipulate however you please.

**bits** - This is used when you want to parse the next byte as individual bits. It is defined as an object that contains keys that outline the label, index, and bitlength of each item within the byte. For example, `firstThreeBits: { index: 0, length: 3 }`.

**parts** - An array defining sub-parts that are parsed recursively. For example, a part could contain five sub parts, that each read off a mixture of unsigned ints and bytes.

**loop** - Loop is used to parse a part multiple times. It is a function that returns `true` or `false` after each parse iteration, indicating whether or not the loop should continue. - `function(stream){}`

### Example

You can see a full example [here][2] of parsing GIF files completely, but here is just the header.

    var gifSchema = [
		{
			label: 'header', // gif header
			parts: [
				{ label: 'signature', parser: Parsers.readString(3) },
				{ label: 'version', parser: Parsers.readString(3) }
			]
		},{
			label: 'lsd', // local screen descriptor
			parts: [
				{ label: 'width', parser: Parsers.readUnsigned(true) },
				{ label: 'height', parser: Parsers.readUnsigned(true) },
				{ label: 'gct', bits: {
					exists: { index: 0 },
					resolution: { index: 1, length: 3 },
					sort: { index: 4 },
					size: { index: 5, length: 3 }
				}},
				{ label: 'backgroundColorIndex', parser: Parsers.readByte() },
				{ label: 'pixelAspectRatio', parser: Parsers.readByte() }
			]
		}
    ];


### Why this parser?

There are other good parsers around, like [jBinary][4], but we weren't a fan of relying on object key ordering, and defining parser types as strings. This parser does only cater to browsers that are able to utilise the `Uint8Array` data type, so if you need something more compatible, these other parsers might better fit your requirements.

### Demo

You can see a full demo **[here][2]** which uses this lib to parse GIF files for manipulation.

### Who are we?

[Unassigned][3]

[1]: http://ruffle.us
[2]: https://github.com/matt-way/gifuct-js
[3]: http://unassigned.co
[4]: https://github.com/jDataView/jBinary