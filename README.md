# dir-walker
An safe, simple realization to traverse an directory in an asynchronous way, recursively, with pausable &amp; resumable feature.

[![NPM](https://nodei.co/npm/dir-walker.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dir-walker/)

**graceful features**

+ simple and efficient, without any dependencies.
+ fully asynchronous.
+ pausable and resumable, with easy control API.

## Install

```bash
npm install dir-walker
```

## Usage

An example:

```javascript
var DirWalker = require('dir-walker');

function fsApi(path, init, callback) {
	var walker = new DirWalker(path);
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

### new DirWalker(path)

Returns a new DirWalker instance, the DirWalker is inherited from EventEmitter, and the recurse will start in the next event loop,
so events bindings should be executed in the current event loop.

### DirWalker#pause()

Pause the recurse I/O immediately.

### DirWalker#resume()

Resume a paused walker.

### DirWalker#step()

If the DirWalker instance is in a paused state, this method makes it `going a step forward`, which means reading a file, a directory path (child items not included) or something else. Nothing would be done otherwise.

### DirWalker#end()

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

Both of the `step` and `pause` API are functioning in an asynchronous way, indeed. So we need to wait for the next event before we can really change the walker state.

The following rules come as a good coding style, which we should keep in mind to get rid of something Illogical:

1. calling `resume` right after `step` is useless, you should delay it in `process.nextTick`. 
2. calling `step` right after `pause` is useless, you should delay it in `process.nextTick`. 
3. One `step` call followed by another in a synchronous code is useless. 

_These are what comes with asynchronous operation, and not supposed to be regarded as bugs._

## Features may be added next

Think you are dealing with a directory with unbelievable depth, and you may want to traverse it just a certain depth, let't say three. How is it possible ? It's evidently not efficient to just use a `depth counter`, since we are actually causing unnecessary I/O with every extra child file inside the directory. This is where the `skip` method may help with.
The `DirWalker#skip()` method may just skip the left files in the current child directory, and go back to the parent directory.

## License

The MIT License.

