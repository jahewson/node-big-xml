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
  
  options = options || {};
  options.gzip = options.gzip || false;
  
  var parser = new expat.Parser('UTF-8');
  var stream = fs.createReadStream(filename);
  
  if (options.gzip) {
    var gunzip = zlib.createGunzip();
    stream.pipe(gunzip);
    stream = gunzip;
  }

  stream.on('data', function(data) {
    if (!parser.parse(data)) {
      self.emit('error', new Error('XML Error: ' + parser.getError()));
    } else {
      self.emit('data', data);
    }
  });

  stream.on('error', function(err) {
    self.emit('error', new Error(err));
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

  self.pause = function() {
    stream.pause();
  };

  self.resume = function() {
    stream.resume();
  };
}
util.inherits(BigXmlReader, events.EventEmitter);
