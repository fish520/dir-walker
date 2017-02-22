
var EventEmitter = require("events").EventEmitter
var libUtil = require("util")
var libFs = require("fs")
var libPath = require("path")

function DirWalker(comparator) {
  var skip = false

  EventEmitter.call(this)

  // in a `dir` event, invoking `ignore()` will avoid travelling things inside that directory.
  this.ignore = function() {
    skip = true
  }

  // a switcher which return the `skip` flag and reset it to false if it's true.
  this._kickout = function() {
    return skip ? !(skip = false) : false
  }

  if(typeof comparator === "function") {
    this.__sortfunc__ = comparator
  }
}

libUtil.inherits(DirWalker, EventEmitter)

/**
 * start the walker.
 */
DirWalker.prototype.start = function(path, dest) {
  var self = this

  this.start = function(){}

  if(dest == undefined) {
    _dirRecurse(path, self, function() {
      if (!self.__ended__) {
        self.__ended__ = true
        self.emit("end", true)
      }
    })
  } else {
    _syncRecursive(path, dest, self, function() {
      if (!self.__ended__) {
        self.__ended__ = true
        self.emit("end", true)
      }
    })
  }
}

/**
 * Pause the recursion.
 */
DirWalker.prototype.pause = function() {
  this.__paused__ = true
}

/**
 * Go on the recursion.
 */
DirWalker.prototype.resume = function() {
  var next = this.__next__

  if (typeof next === "function") {
    this.__next__ = null
    this.__paused__ = false
    next()
  }
}

/**
 * Go a single step manually, supposed to be invoked in a paused state only.
 */
DirWalker.prototype.step = function() {
  var next = this.__next__
  if (typeof next === "function") {
    this.__next__ = null
    next()
  }
}

/**
 * Terminate the recurse manually, well-designed.
 */
DirWalker.prototype.end = function() {
  this.__paused__ ? this.emit("end", false) : this.pause()
  this.__next__ = null
  this.__ended__ = true
}

/**
 * Remember the pause point, or just keep going on.
 */
function _tick(walker, next) {
  return walker.__paused__ ? walker.__ended__ ? walker.emit("end", false) : walker.__next__ = next : next()
}

/**
 * Traverse the directory in an asynchronous way, recursively.
 */
function _dirRecurse(path, walker, next) {

  libFs.stat(path, function(err, stat) {

    if (err) {
      walker.emit("error", err)
      return _tick(walker, next)
    }

    if (stat.isDirectory()) {

      walker.emit("dir", path, stat)

      if (walker._kickout()) {
        walker.emit("pop", path)
        return _tick(walker, next)
      }

      libFs.readdir(path, function(err, files) {
        var base = path

        if (err) {
          walker.emit("pop", base)
          walker.emit("error", err)
          return _tick(walker, next)
        }

        if(walker.__sortfunc__) {
          files.length > 1 && files.sort(walker.__sortfunc__)
        }

        function oneByOne() {
          var file
          if (file = files.shift()) {
            _dirRecurse(libPath.join(base, file), walker, oneByOne)
          } else {
            walker.emit("pop", base)
            _tick(walker, next)
          }
        }

        _tick(walker, oneByOne)
      })
    } else {
      walker.emit(stat.isFile() ? "file" : "other", path, stat)
      _tick(walker, next)
    }
  })
}

function _syncRecursive(source, dest, walker, next) {

  libFs.stat(source, function(err, stat) {

    if(err) {
      walker.emit("error", err)
      return _tick(walker, next)
    }

    if(stat.isDirectory()) {

      walker.emit("dir", source, dest, stat)

      if (walker._kickout()) {
        walker.emit("pop", source, dest)
        return _tick(walker, next)
      }

      libFs.readdir(source, function(err, files) {

        if (err) {
          walker.emit("pop", source, dest)
          walker.emit("error", err)
          return _tick(walker, next)
        }

        if(walker.__sortfunc__) {
          files.length > 1 && files.sort(walker.__sortfunc__)
        }

        function oneByOne() {
          var file
          if (file = files.shift()) {
            _syncRecursive(libPath.join(source, file), libPath.join(dest, file), walker, oneByOne)
          } else {
            walker.emit("pop", source, dest)
            _tick(walker, next)
          }
        }

        _tick(walker, oneByOne)
      });
    } else {
      walker.emit(stat.isFile() ? "file" : "other", source, dest, stat)
      _tick(walker, next)
    }
  });
}

module.exports = function(fn) {
  return new DirWalker(fn)
}
