# big-xml -- Lightweight XML parser for really big files

A record-by-record XML reader, for [node.js](http://nodejs.org/), based on [node-expat](https://github.com/astro/node-expat).

Designed for big XML files (1GB+), and low memory usage.

## Install

    npm install big-xml

or from source:

    git clone git://github.com/jahewson/node-big-xml.git
    cd node-big-xml
    npm link

#Example

XML files are streamed, and parsed one record at a time, which keeps memory usage low.

You must specify which XML elements should be considered as the root of a record, using a regex. In this
example the elements Foo and Bar will be emitted as records.

```javascript
var bigXml = require('big-xml');
    
var reader = bigXml.createReader('data.xml.gz', /^(Foo|Bar)$/, { gzip: true });

reader.on('record', function(record) {
  console.log(record);
});
```

The output would take the form:

```javascript
{ tag: 'Foo',
  attrs: { Name: 'John', Status: 'Student' },
  children: [
    { tag: 'Color', text: 'blue'} 
  ]
}
```

And if you want to handle errors (by default they are thrown):

```
reader.on('error', function(err) {
  console.log(err);
});
```
