var expat = require('node-expat'),
    fs = require('fs'),
    events = require('events'),
    util = require('util'),
    zlib = require('zlib');
    
exports.createReader = function(filename, recordRegEx, options) {
  return new BigXmlReader(filename, recordRegEx, options);
};
    
function BigXmlReader(filename, recordRegEx, options) {
  var self = this;
  
  options.lists = options.lists || [];
  options.gzip = options.gzip || false;
  
  var parser = new expat.Parser('UTF-8');
  var stream = fs.createReadStream(filename);
  
  if (options.gzip) {
    var gunzip = zlib.createGunzip();
    stream.pipe(gunzip);
    stream = gunzip;
  }

  stream.on('data', function(data) {
    parser.parse(data);
    self.emit('data', data);
  });
  
  ///////////////////////////

  var node = {};
  var nodes = [];
  var record;
  var isCapturing = false;
  var level = 0;
  
  parser.on('startElement', function(name, attrs) {
    level++;
    
    if (!isCapturing && !name.match(recordRegEx)) {
      return;
    }
    else if (!isCapturing) {
      isCapturing = true;
      node = {};
      nodes = [];
      record = undefined;
    }
    
    if (node.children === undefined) {
      node.children = [];
    }
   
    var child = { tag: name };
    node.children.push(child);
    
    if (Object.keys(attrs).length > 0) {
      child.attrs = attrs;
    }
    
    nodes.push(node);
    node = child;

    if (name.match(recordRegEx)) {
      record = node;
    }
  });

  parser.on('text', function(txt) {
    if (!isCapturing) {
      return;
    }
    
    if (txt.length > 0) {
      if (node.text === undefined) {
        node.text = txt;
      } else {
        node.text += txt;
      }
    }
  });

  parser.on('endElement', function(name) {
    level--;
    node = nodes.pop();
    
    if (name.match(recordRegEx)) {
      isCapturing = false;
      self.emit('record', record);
    }
    
    if (level === 0) {
      self.emit('end');
    }
    
  });

  // pause stream
  self.pause = function() {
    stream.pause();
    this._suspended = true;
    if( !parser.pause() ) {
      throw(new Error("Cannot pause parser: "+parser.getError()));
    }
  };

// resume stream
  self.resume = function() {
    this._suspended = false;

    if( !parser.resume() ) {
      throw(new Error("Cannot resume parser: "+parser.getError()));
    }

    // resume stream only if parser hasn't been paused again
    if( !this._suspended ) {
      stream.resume();
    }
  };
}
util.inherits(BigXmlReader, events.EventEmitter);
