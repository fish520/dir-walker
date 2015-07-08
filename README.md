# FsWalker
An safe, simple realization to traverse an directory in an asynchronous way, recursively, with pausable &amp; resumable feature.

## Install

```bash
npm install FsWalker
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

