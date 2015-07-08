# FsWalker
An safe, simple realization to traverse an directory in an asynchronous way, recursively, with pausable &amp; resumable feature.

## Install

```bash
npm install FsWalker
```

## Usage

An example:

```javascript
var FsWalker = require('fswalker');

function fsApi(path, init, callback) {
	var walker = new FsWalker(path);
	init(walker);
	walker.once("end", callback);
}

fsApi("D:\\workspace", function init(walker){
	walker.on("file", function (path, stat){
		walker.pause();
		setTimeout(function(){walker.resume()}, 100);  // print a file every 100ms
		console.log("%c" + log_indent + path, "color: #999;");
	}).on("dir", function(path, stat){
		walker.pause();
		setTimeout(function(){walker.resume()}, 100);
		console.log(log_indent + ">> " + path);
		if(log_indent == "") log_indent = "- ";
		else log_indent = "\t" + log_indent;
		if(log_indent.length > 5) {
		   walker.end();    // terminate the recurse in an specific condition
		}
	}).on("dir_pop", function(path){
		log_indent = log_indent.substr(1);
	});
}, function (complete){
	console.log("END: completed = " + complete);
});
```


## API

### new FsWalker(path)

Returns a new FsWalker instance, the FsWalker is inherited from EventEmitter, and the recurse will start in the next event loop,
so events bindings should be executed in the current event loop.

### FsWalker#pause()

Pause the recurse I/O immediately.

### FsWalker#resume()

Resume a paused walker.

### FsWalker#step()

If the FsWalker instance is in a paused state, this method makes it `going a step forward`, which means reading a file, a directory path (child items not included) or something else. Nothing would be done otherwise.

### FsWalker#end()

Terminate the recurse, no more I/O will be executed. An `end` event is triggered with the flag `false`, which means that the I/O is not completed.

## Events

### Event: 'dir'

An directory found.

+ *path* the path of the current directory.
+ *stat* the `stat` object of the current directory.

### Event: 'dir_pop'

An directory was fully traversed.

+ *path* the path of the current directory.
+ *stat* the `stat` object of the current directory.

### Event: 'error'

An wrapper for any FileSystem I/O error throwed internally.

### Event: 'file'

An regular file was traversed.

### Event: 'other'

For ther type of files, such as BlockDevice, SymbolicLink, etc.

## FAQ

Both of the `step` and `pause` API are functioning in an asynchronous way, indeed.So we need to wait for the next event before we can really change the walker state.

The following rules come as a good coding style, which we should keep in mind to get rid of something Illogical:

1. calling `resume` right after `step` is useless, you should delay it in nextTick. 
2. calling `step` right after `pause` is useless, you should delay it in nextTick. 
3. One `step` call followed by another in a synchronous code is useless. 

