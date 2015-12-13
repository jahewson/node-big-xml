# big-xml-streamer -- Lightweight XML parser for really big files

## Note
This is a fork of [big-xml](https://www.npmjs.com/package/big-xml)

**big-xml** is a great plugin that wasn't update for 4 years, so that, we have created a fork, with an update it with the capability of pause/resume the stream.

# Resume

A record-by-record XML reader, for [node.js](http://nodejs.org/), based on [node-expat](https://github.com/astro/node-expat).

Designed for big XML files (1GB+), and low memory usage.

## Install

    npm install big-xml-streamer

or from source:

    git clone git://github.com/jahewson/node-big-xml.git
    cd node-big-xml
    npm link

# Example

XML files are streamed, and parsed one record at a time, which keeps memory usage low.

You must specify which XML elements should be considered as the root of a record, using a regex. In this
example the elements Foo and Bar will be emitted as records.

```javascript
var bigXml = require('big-xml-streamer');
    
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


# Pause and resume

You can pause and resume the stream in any moment, in order to make asyncs calls.



```javascript
reader.on('record', function(record) {
  console.log(record);
  reader.pause();
  setTimeout(function(){ reader.resume(); }, 3000);
  
});
```

