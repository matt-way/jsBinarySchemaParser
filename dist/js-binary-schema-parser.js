(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// Stream object for reading off bytes from a byte array

function ByteStream(data){
	this.data = data;
	this.pos = 0;
}

// read the next byte off the stream
ByteStream.prototype.readByte = function(){
	return this.data[this.pos++];
};

// look at the next byte in the stream without updating the stream position
ByteStream.prototype.peekByte = function(){
	return this.data[this.pos];
};

// read an array of bytes
ByteStream.prototype.readBytes = function(n){
	var bytes = new Array(n);
	for(var i=0; i<n; i++){
		bytes[i] = this.readByte();
	}
	return bytes;
};

// peek at an array of bytes without updating the stream position
ByteStream.prototype.peekBytes = function(n){
	var bytes = new Array(n);
	for(var i=0; i<n; i++){
		bytes[i] = this.data[this.pos + i];
	}
	return bytes;
};

// read a string from a byte set
ByteStream.prototype.readString = function(len){
	var str = '';
	for(var i=0; i<len; i++){
		str += String.fromCharCode(this.readByte());
	}
	return str;
};

// read a single byte and return an array of bit booleans
ByteStream.prototype.readBitArray = function(){
	var arr = [];
	var bite = this.readByte();
	for (var i = 7; i >= 0; i--) {
		arr.push(!!(bite & (1 << i)));
	}
	return arr;
};

// read an unsigned int with endian option
ByteStream.prototype.readUnsigned = function(littleEndian){
	var a = this.readBytes(2);
	if(littleEndian){
		return (a[1] << 8) + a[0];	
	}else{
		return (a[0] << 8) + a[1];
	}	
};

module.exports = ByteStream;
},{}],2:[function(require,module,exports){

// Primary data parsing object used to parse byte arrays

var ByteStream = require('./bytestream');

function DataParser(data){
	this.stream = new ByteStream(data);
	// the final parsed object from the data
	this.output = {};
}

DataParser.prototype.parse = function(schema){
	// the top level schema is just the top level parts array
	this.parseParts(this.output, schema);	
	return this.output;
};

// parse a set of hierarchy parts providing the parent object, and the subschema
DataParser.prototype.parseParts = function(obj, schema){
	for(var i=0; i<schema.length; i++){
		var part = schema[i];
		this.parsePart(obj, part); 
	}
};

DataParser.prototype.parsePart = function(obj, part){
	var name = part.label;
	var value;

	// make sure the part meets any parse requirements
	if(part.requires && ! part.requires(this.stream, this.output, obj)){
		return;
	}
	
	if(part.loop){
		// create a parse loop over the parts
		var items = [];
		while(part.loop(this.stream)){
			var item = {};
			this.parseParts(item, part.parts);
			items.push(item);
		}
		obj[name] = items;
	}else if(part.parts){
		// process any child parts
		value = {};
		this.parseParts(value, part.parts);
		obj[name] = value;
	}else if(part.parser){
		// parse the value using a parser
		value = part.parser(this.stream, this.output, obj);
		if(!part.skip){
			obj[name] = value;
		}
	}else if(part.bits){
		// convert the next byte to a set of bit fields
		obj[name] = this.parseBits(part.bits);
	}
};

// combine bits to calculate value
function bitsToNum(bitArray){
	return bitArray.reduce(function(s, n) { return s * 2 + n; }, 0);
}

// parse a byte as a bit set (flags and values)
DataParser.prototype.parseBits = function(details){
	var out = {};
	var bits = this.stream.readBitArray();
	for(var key in details){
		var item = details[key];
		if(item.length){
			// convert the bit set to value
			out[key] = bitsToNum(bits.slice(item.index, item.index + item.length));
		}else{
			out[key] = bits[item.index];
		}
	}
	return out;
};

module.exports = DataParser;
},{"./bytestream":1}],3:[function(require,module,exports){
// export wrapper for exposing library

var BSP = window.BSP || {};

BSP.DataParser = require('./dataparser');
BSP.Parsers = require('./parsers');

window.BSP = BSP;
},{"./dataparser":2,"./parsers":4}],4:[function(require,module,exports){

// a set of common parsers used with DataParser

var Parsers = {
	// read a byte
	readByte: function(){
		return function(stream){
			return stream.readByte();
		};
	},
	// read an array of bytes
	readBytes: function(length){
		return function(stream){
			return stream.readBytes(length);
		};
	},
	// read a string from bytes
	readString: function(length){
		return function(stream){
			return stream.readString(length);
		};
	},
	// read an unsigned int (with endian)
	readUnsigned: function(littleEndian){
		return function(stream){
			return stream.readUnsigned(littleEndian);
		};
	},
	// read an array of byte sets
	readArray: function(size, countFunc){
		return function(stream, obj, parent){
			var count = countFunc(stream, obj, parent);
			var arr = new Array(count);
			for(var i=0; i<count; i++){
				arr[i] = stream.readBytes(size);
			}
			return arr;
		};
	}
};

module.exports = Parsers;
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYnl0ZXN0cmVhbS5qcyIsInNyYy9kYXRhcGFyc2VyLmpzIiwic3JjL2V4cG9ydHMuanMiLCJzcmMvcGFyc2Vycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLy8gU3RyZWFtIG9iamVjdCBmb3IgcmVhZGluZyBvZmYgYnl0ZXMgZnJvbSBhIGJ5dGUgYXJyYXlcblxuZnVuY3Rpb24gQnl0ZVN0cmVhbShkYXRhKXtcblx0dGhpcy5kYXRhID0gZGF0YTtcblx0dGhpcy5wb3MgPSAwO1xufVxuXG4vLyByZWFkIHRoZSBuZXh0IGJ5dGUgb2ZmIHRoZSBzdHJlYW1cbkJ5dGVTdHJlYW0ucHJvdG90eXBlLnJlYWRCeXRlID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnBvcysrXTtcbn07XG5cbi8vIGxvb2sgYXQgdGhlIG5leHQgYnl0ZSBpbiB0aGUgc3RyZWFtIHdpdGhvdXQgdXBkYXRpbmcgdGhlIHN0cmVhbSBwb3NpdGlvblxuQnl0ZVN0cmVhbS5wcm90b3R5cGUucGVla0J5dGUgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gdGhpcy5kYXRhW3RoaXMucG9zXTtcbn07XG5cbi8vIHJlYWQgYW4gYXJyYXkgb2YgYnl0ZXNcbkJ5dGVTdHJlYW0ucHJvdG90eXBlLnJlYWRCeXRlcyA9IGZ1bmN0aW9uKG4pe1xuXHR2YXIgYnl0ZXMgPSBuZXcgQXJyYXkobik7XG5cdGZvcih2YXIgaT0wOyBpPG47IGkrKyl7XG5cdFx0Ynl0ZXNbaV0gPSB0aGlzLnJlYWRCeXRlKCk7XG5cdH1cblx0cmV0dXJuIGJ5dGVzO1xufTtcblxuLy8gcGVlayBhdCBhbiBhcnJheSBvZiBieXRlcyB3aXRob3V0IHVwZGF0aW5nIHRoZSBzdHJlYW0gcG9zaXRpb25cbkJ5dGVTdHJlYW0ucHJvdG90eXBlLnBlZWtCeXRlcyA9IGZ1bmN0aW9uKG4pe1xuXHR2YXIgYnl0ZXMgPSBuZXcgQXJyYXkobik7XG5cdGZvcih2YXIgaT0wOyBpPG47IGkrKyl7XG5cdFx0Ynl0ZXNbaV0gPSB0aGlzLmRhdGFbdGhpcy5wb3MgKyBpXTtcblx0fVxuXHRyZXR1cm4gYnl0ZXM7XG59O1xuXG4vLyByZWFkIGEgc3RyaW5nIGZyb20gYSBieXRlIHNldFxuQnl0ZVN0cmVhbS5wcm90b3R5cGUucmVhZFN0cmluZyA9IGZ1bmN0aW9uKGxlbil7XG5cdHZhciBzdHIgPSAnJztcblx0Zm9yKHZhciBpPTA7IGk8bGVuOyBpKyspe1xuXHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMucmVhZEJ5dGUoKSk7XG5cdH1cblx0cmV0dXJuIHN0cjtcbn07XG5cbi8vIHJlYWQgYSBzaW5nbGUgYnl0ZSBhbmQgcmV0dXJuIGFuIGFycmF5IG9mIGJpdCBib29sZWFuc1xuQnl0ZVN0cmVhbS5wcm90b3R5cGUucmVhZEJpdEFycmF5ID0gZnVuY3Rpb24oKXtcblx0dmFyIGFyciA9IFtdO1xuXHR2YXIgYml0ZSA9IHRoaXMucmVhZEJ5dGUoKTtcblx0Zm9yICh2YXIgaSA9IDc7IGkgPj0gMDsgaS0tKSB7XG5cdFx0YXJyLnB1c2goISEoYml0ZSAmICgxIDw8IGkpKSk7XG5cdH1cblx0cmV0dXJuIGFycjtcbn07XG5cbi8vIHJlYWQgYW4gdW5zaWduZWQgaW50IHdpdGggZW5kaWFuIG9wdGlvblxuQnl0ZVN0cmVhbS5wcm90b3R5cGUucmVhZFVuc2lnbmVkID0gZnVuY3Rpb24obGl0dGxlRW5kaWFuKXtcblx0dmFyIGEgPSB0aGlzLnJlYWRCeXRlcygyKTtcblx0aWYobGl0dGxlRW5kaWFuKXtcblx0XHRyZXR1cm4gKGFbMV0gPDwgOCkgKyBhWzBdO1x0XG5cdH1lbHNle1xuXHRcdHJldHVybiAoYVswXSA8PCA4KSArIGFbMV07XG5cdH1cdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCeXRlU3RyZWFtOyIsIlxuLy8gUHJpbWFyeSBkYXRhIHBhcnNpbmcgb2JqZWN0IHVzZWQgdG8gcGFyc2UgYnl0ZSBhcnJheXNcblxudmFyIEJ5dGVTdHJlYW0gPSByZXF1aXJlKCcuL2J5dGVzdHJlYW0nKTtcblxuZnVuY3Rpb24gRGF0YVBhcnNlcihkYXRhKXtcblx0dGhpcy5zdHJlYW0gPSBuZXcgQnl0ZVN0cmVhbShkYXRhKTtcblx0Ly8gdGhlIGZpbmFsIHBhcnNlZCBvYmplY3QgZnJvbSB0aGUgZGF0YVxuXHR0aGlzLm91dHB1dCA9IHt9O1xufVxuXG5EYXRhUGFyc2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHNjaGVtYSl7XG5cdC8vIHRoZSB0b3AgbGV2ZWwgc2NoZW1hIGlzIGp1c3QgdGhlIHRvcCBsZXZlbCBwYXJ0cyBhcnJheVxuXHR0aGlzLnBhcnNlUGFydHModGhpcy5vdXRwdXQsIHNjaGVtYSk7XHRcblx0cmV0dXJuIHRoaXMub3V0cHV0O1xufTtcblxuLy8gcGFyc2UgYSBzZXQgb2YgaGllcmFyY2h5IHBhcnRzIHByb3ZpZGluZyB0aGUgcGFyZW50IG9iamVjdCwgYW5kIHRoZSBzdWJzY2hlbWFcbkRhdGFQYXJzZXIucHJvdG90eXBlLnBhcnNlUGFydHMgPSBmdW5jdGlvbihvYmosIHNjaGVtYSl7XG5cdGZvcih2YXIgaT0wOyBpPHNjaGVtYS5sZW5ndGg7IGkrKyl7XG5cdFx0dmFyIHBhcnQgPSBzY2hlbWFbaV07XG5cdFx0dGhpcy5wYXJzZVBhcnQob2JqLCBwYXJ0KTsgXG5cdH1cbn07XG5cbkRhdGFQYXJzZXIucHJvdG90eXBlLnBhcnNlUGFydCA9IGZ1bmN0aW9uKG9iaiwgcGFydCl7XG5cdHZhciBuYW1lID0gcGFydC5sYWJlbDtcblx0dmFyIHZhbHVlO1xuXG5cdC8vIG1ha2Ugc3VyZSB0aGUgcGFydCBtZWV0cyBhbnkgcGFyc2UgcmVxdWlyZW1lbnRzXG5cdGlmKHBhcnQucmVxdWlyZXMgJiYgISBwYXJ0LnJlcXVpcmVzKHRoaXMuc3RyZWFtLCB0aGlzLm91dHB1dCwgb2JqKSl7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdFxuXHRpZihwYXJ0Lmxvb3Ape1xuXHRcdC8vIGNyZWF0ZSBhIHBhcnNlIGxvb3Agb3ZlciB0aGUgcGFydHNcblx0XHR2YXIgaXRlbXMgPSBbXTtcblx0XHR3aGlsZShwYXJ0Lmxvb3AodGhpcy5zdHJlYW0pKXtcblx0XHRcdHZhciBpdGVtID0ge307XG5cdFx0XHR0aGlzLnBhcnNlUGFydHMoaXRlbSwgcGFydC5wYXJ0cyk7XG5cdFx0XHRpdGVtcy5wdXNoKGl0ZW0pO1xuXHRcdH1cblx0XHRvYmpbbmFtZV0gPSBpdGVtcztcblx0fWVsc2UgaWYocGFydC5wYXJ0cyl7XG5cdFx0Ly8gcHJvY2VzcyBhbnkgY2hpbGQgcGFydHNcblx0XHR2YWx1ZSA9IHt9O1xuXHRcdHRoaXMucGFyc2VQYXJ0cyh2YWx1ZSwgcGFydC5wYXJ0cyk7XG5cdFx0b2JqW25hbWVdID0gdmFsdWU7XG5cdH1lbHNlIGlmKHBhcnQucGFyc2VyKXtcblx0XHQvLyBwYXJzZSB0aGUgdmFsdWUgdXNpbmcgYSBwYXJzZXJcblx0XHR2YWx1ZSA9IHBhcnQucGFyc2VyKHRoaXMuc3RyZWFtLCB0aGlzLm91dHB1dCwgb2JqKTtcblx0XHRpZighcGFydC5za2lwKXtcblx0XHRcdG9ialtuYW1lXSA9IHZhbHVlO1xuXHRcdH1cblx0fWVsc2UgaWYocGFydC5iaXRzKXtcblx0XHQvLyBjb252ZXJ0IHRoZSBuZXh0IGJ5dGUgdG8gYSBzZXQgb2YgYml0IGZpZWxkc1xuXHRcdG9ialtuYW1lXSA9IHRoaXMucGFyc2VCaXRzKHBhcnQuYml0cyk7XG5cdH1cbn07XG5cbi8vIGNvbWJpbmUgYml0cyB0byBjYWxjdWxhdGUgdmFsdWVcbmZ1bmN0aW9uIGJpdHNUb051bShiaXRBcnJheSl7XG5cdHJldHVybiBiaXRBcnJheS5yZWR1Y2UoZnVuY3Rpb24ocywgbikgeyByZXR1cm4gcyAqIDIgKyBuOyB9LCAwKTtcbn1cblxuLy8gcGFyc2UgYSBieXRlIGFzIGEgYml0IHNldCAoZmxhZ3MgYW5kIHZhbHVlcylcbkRhdGFQYXJzZXIucHJvdG90eXBlLnBhcnNlQml0cyA9IGZ1bmN0aW9uKGRldGFpbHMpe1xuXHR2YXIgb3V0ID0ge307XG5cdHZhciBiaXRzID0gdGhpcy5zdHJlYW0ucmVhZEJpdEFycmF5KCk7XG5cdGZvcih2YXIga2V5IGluIGRldGFpbHMpe1xuXHRcdHZhciBpdGVtID0gZGV0YWlsc1trZXldO1xuXHRcdGlmKGl0ZW0ubGVuZ3RoKXtcblx0XHRcdC8vIGNvbnZlcnQgdGhlIGJpdCBzZXQgdG8gdmFsdWVcblx0XHRcdG91dFtrZXldID0gYml0c1RvTnVtKGJpdHMuc2xpY2UoaXRlbS5pbmRleCwgaXRlbS5pbmRleCArIGl0ZW0ubGVuZ3RoKSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRvdXRba2V5XSA9IGJpdHNbaXRlbS5pbmRleF07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFQYXJzZXI7IiwiLy8gZXhwb3J0IHdyYXBwZXIgZm9yIGV4cG9zaW5nIGxpYnJhcnlcblxudmFyIEJTUCA9IHdpbmRvdy5CU1AgfHwge307XG5cbkJTUC5EYXRhUGFyc2VyID0gcmVxdWlyZSgnLi9kYXRhcGFyc2VyJyk7XG5CU1AuUGFyc2VycyA9IHJlcXVpcmUoJy4vcGFyc2VycycpO1xuXG53aW5kb3cuQlNQID0gQlNQOyIsIlxuLy8gYSBzZXQgb2YgY29tbW9uIHBhcnNlcnMgdXNlZCB3aXRoIERhdGFQYXJzZXJcblxudmFyIFBhcnNlcnMgPSB7XG5cdC8vIHJlYWQgYSBieXRlXG5cdHJlYWRCeXRlOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHJlYW0pe1xuXHRcdFx0cmV0dXJuIHN0cmVhbS5yZWFkQnl0ZSgpO1xuXHRcdH07XG5cdH0sXG5cdC8vIHJlYWQgYW4gYXJyYXkgb2YgYnl0ZXNcblx0cmVhZEJ5dGVzOiBmdW5jdGlvbihsZW5ndGgpe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHJlYW0pe1xuXHRcdFx0cmV0dXJuIHN0cmVhbS5yZWFkQnl0ZXMobGVuZ3RoKTtcblx0XHR9O1xuXHR9LFxuXHQvLyByZWFkIGEgc3RyaW5nIGZyb20gYnl0ZXNcblx0cmVhZFN0cmluZzogZnVuY3Rpb24obGVuZ3RoKXtcblx0XHRyZXR1cm4gZnVuY3Rpb24oc3RyZWFtKXtcblx0XHRcdHJldHVybiBzdHJlYW0ucmVhZFN0cmluZyhsZW5ndGgpO1xuXHRcdH07XG5cdH0sXG5cdC8vIHJlYWQgYW4gdW5zaWduZWQgaW50ICh3aXRoIGVuZGlhbilcblx0cmVhZFVuc2lnbmVkOiBmdW5jdGlvbihsaXR0bGVFbmRpYW4pe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHJlYW0pe1xuXHRcdFx0cmV0dXJuIHN0cmVhbS5yZWFkVW5zaWduZWQobGl0dGxlRW5kaWFuKTtcblx0XHR9O1xuXHR9LFxuXHQvLyByZWFkIGFuIGFycmF5IG9mIGJ5dGUgc2V0c1xuXHRyZWFkQXJyYXk6IGZ1bmN0aW9uKHNpemUsIGNvdW50RnVuYyl7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgb2JqLCBwYXJlbnQpe1xuXHRcdFx0dmFyIGNvdW50ID0gY291bnRGdW5jKHN0cmVhbSwgb2JqLCBwYXJlbnQpO1xuXHRcdFx0dmFyIGFyciA9IG5ldyBBcnJheShjb3VudCk7XG5cdFx0XHRmb3IodmFyIGk9MDsgaTxjb3VudDsgaSsrKXtcblx0XHRcdFx0YXJyW2ldID0gc3RyZWFtLnJlYWRCeXRlcyhzaXplKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhcnI7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYXJzZXJzOyJdfQ==
