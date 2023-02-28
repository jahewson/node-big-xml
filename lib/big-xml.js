var expat = require('node-expat'),
    fs = require('fs'),
    events = require('events'),
    util = require('util'),
    zlib = require('zlib');
    
exports.createReader = (filename, recordRegEx, options) => {
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

  stream.on('data', (data) => {
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

  parser.on('text', (txt) => {
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

  parser.on('endElement', (name) => {
    level--;
    node = nodes.pop();
    
    if (name.match(recordRegEx)) {
      isCapturing = false;
      self.emit('record', XMLToJson(record));
    }
    
    if (level === 0) {
      self.emit('end');
    }
    
  });

  self.pause = () => {
    stream.pause();
  };

  self.resume = () => {
    stream.resume();
  };
}

function XMLToJson   (record)  {
  let result =  {};


  if (!xml.children) {
    result[xml.tag] = xml.text || undefined;
    return result;
    }

      let childObjects = xml.children.map(child => XMLToJson(child));
      let firstTagName = xml.children[0].tag;
      // check if all children have the same tag name
      if (childObjects.every(child => Object.keys(child)[0] === firstTagName)) {
          result[xml.tag] = childObjects;
      } else {
          result[xml.tag] = childObjects.reduce((acc, child) => {
              return { ...acc, ...child };
          }, {});
      }
  
  return result;
}



util.inherits(BigXmlReader, events.EventEmitter);
