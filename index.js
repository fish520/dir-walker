
var EventEmitter = require("events").EventEmitter;
var libUtil = require("util");
var libFs = require("fs");
var libPath = require("path");

function FsWalker(path) {
	var self = this;
	EventEmitter.call(this);
	process.nextTick(function(){
		_fsRecurse(path, self, function(){
			if(!self.ended) {		// avoid triggering the `end` event twice when calling the tail `step()` in a paused state.
				self.ended = true;
				self.emit("end", true);
			}
		});
	});
}

libUtil.inherits(FsWalker, EventEmitter);

/*
* Pause the recursion, no more event will be triggered.
*/
FsWalker.prototype.pause = function() {
	this._paused = true;
}

/*
* Go on the recursion.
*/
FsWalker.prototype.resume = function() {
	var next = this._goon;
	this._paused = false;
	if(typeof next === "function") {
		this._goon = null;
		next();
	}
}

/*
* Go a single step forward manually.
*/
FsWalker.prototype.step = function() {
	var next = this._goon;
	if(/*this._paused === true && */typeof next === "function") {
		// really necessary, 
		// or we may calling the same `next` again when `step` is called twice continuously,
		// which lead to a new recurse branch and the result is unkown.
		this._goon = null;
		next();
	}
}

/*
* Terminate the recurse manually, well-designed.
*/
FsWalker.prototype.end = function() {
	var self = this;
	this.pause();
	this._goon = null;		// if _tick aready executed.
	process.nextTick(function(){	// Think if we execute `walker.resume()` in the next event loop, in an `end` callback, this is what we defend with.
		self._goon = null;
	});
	this.emit("end", false);
}

/*
* Pause and remember the pause point, or just keep going on.
* @param {Object} walker  The walker object that holds the recurse state.
* @param {Function} next  The callback that consume the stack of recursive algorithm.
*/
function _tick(walker, next) {
	if(walker._paused) {
		walker._goon = next;
	} else {
		next();
	}
}

/*
* Traverse the directory in an asynchronous way, recursively.
*/
function _fsRecurse(path, walker, next) {

	libFs.stat(path, function(err, stat) {

		if(err) {
			walker.emit("error", err);
			return _tick(walker, next);
		}

		if(stat.isDirectory()) {

			walker.emit("dir", path, stat);

			libFs.readdir(path, function(err, files) {
				var base = path;

				if(err) {
					walker.emit("error", err);
					return _tick(walker, next);
				}

				function oneByOne() {
					var file;
					if(file = files.shift()) {
						_fsRecurse(libPath.join(base, file), walker, oneByOne);
					} else {
						walker.emit("dir_pop", base);
						_tick(walker, next);
					}
				}

				_tick(walker, oneByOne);
			});
		} else if(stat.isFile()) {
			walker.emit("file", path, stat);
			_tick(walker, next);
		} else {
			walker.emit("other", path, stat);
			_tick(walker, next);
		}
	});
}

module.exports = FsWalker;
