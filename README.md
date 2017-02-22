# dir-walker

An safe, simple realization to traverse an directory in an asynchronous way, recursively, with pausable &amp; resumable feature.  
This is the `2.0 version`, the old v1.0 branch is available [here](). 

**graceful features**

+ simple and efficient, with no dependency.
+ fully asynchronous.
+ easy control api to pause, resume, skip items or abort, etc.

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
	}).on("pop", function(path){
		log_indent = log_indent.substr(1);
	}).on("error", function(err){
        console.log(err);
    });
}, function (complete){
	console.log("END: completed = " + complete);
});
```

Here is a test for large directory, no stack overflow is supposed to happen.

```javascript

var depth = 0;
var total = 0;
var accCount = 0;
var max_depth = 0;
var deepest_path = "";

function fsApi(path, init, callback) {
	var walker = new DirWalker(path)
	init(walker)
	walker.once("end", callback)
}

fsApi("c:\\Windows", function init(walker){
	walker.on("file", function (path, stat){
		accCount++;
		if(accCount == 1000) {
			accCount = 0;
			total += 1000;
			console.log(total + " files found");    // log every 1000 files.
		}
	}).on("dir", function(path, stat){
		depth++;
		if(depth > max_depth) {
            max_depth = depth;
            deepest_path = path;
        }
	}).on("pop", function(path){
		depth--;
	}).on("error", function(err){
        console.log(err);
    });
}, function (){
	console.log("total " + (total+accCount) + " files, max_depth = " + max_depth);
    console.log("the deepest path is: " + deepest_path);
});

```


## API

### new DirWalker(path)

Returns a new DirWalker instance, the DirWalker is inherited from EventEmitter, and the recurse will start in the next event loop,
so events bindings should be executed in the current event loop.

### DirWalker#ignore()

skip travelling things inside the current directory, this is supposed to be invoked in a `dir` event callback.  
and a `pop` event will be emitted right after the invoke.  
Invoking it anywhere else will cause it skip things inside the directory coresponding to the next `dir` event,  
you may also invoke the internal `DirWalker#keepon()` to undo this operation in a rare case.

### DirWalker#pause()

Pause the recurse I/O immediately.

### DirWalker#resume()

Resume a paused walker.

### DirWalker#step()

If the DirWalker instance is in a paused state, this method makes it `going a step forward`, which means reading a file, a directory path (child items not included) or something else. Nothing would be done otherwise.

### DirWalker#end()

Terminate the recurse, no more I/O will be executed. An `end` event is triggered with the flag `false`, which means that the I/O is not completed.

## Events

### Event: 'file'

An regular file was traversed.

### Event: 'dir'

An directory found.

+ *path* the path of the current directory.
+ *stat* the `stat` object of the current directory.

### Event: 'pop'

An directory was fully traversed.

+ *path* the path of the current directory.
+ *stat* the `stat` object of the current directory.

### Event: 'other'

For ther type of files, such as BlockDevice, SymbolicLink, etc.

### Event: 'error'

An wrapper for any FileSystem I/O error throwed internally.

## FAQ

Both of the `step` and `pause` API are functioning in an asynchronous way, indeed.
So we need to wait for the next event before we can really change the walker state.

The following rules come as a good coding style, which we should keep in mind to get rid of something Illogical:

1. calling `resume` right after `step` is useless, you should delay it in `process.nextTick`. 
2. calling `step` right after `pause` is useless, you should delay it in `process.nextTick`. 
3. One `step` call followed by another in a synchronous code is useless. 

_These are what comes with asynchronous operation, and not supposed to be regarded as bugs._

## how to constraint the depth of a traverse ?

Think you are dealing with a directory with unbelievable depth, and you may want to traverse it just a certain depth, let't say three.
How is it possible ?
It's evidently not efficient to just use a `depth counter` and ignore the callback processer, since we are actually causing unnecessary I/O with 
every extra child file inside the directory. This is where the `ignore` method may help with.
The `DirWalker#ignore()` method just skip all staff inside the current directory, and go on where it is.  

the code will be as simple as the following:  

```javascript
walker.on('dir', function(){
    if(depth++ > MAX_DEPTH) walker.ignore()
});
walker.on('pop', function(){
    depth--
});
```

## License

The MIT License.

