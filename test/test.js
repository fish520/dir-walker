let DirWalker = require('../index')

function fsApi(path, init, callback) {
  let walker = new DirWalker()

  init(walker)
  walker.start(path)
  walker.once('end', callback)
}

function tick(walker) {
  walker.pause()

  setTimeout(() => {
    walker.resume()  // print a file per 50ms
  }, 50)
}

let log_indent = ''
let fileCount = 0

fsApi('D:\\Vue\\others\\jr-app', (walker) => {
  walker.on('file', (path, stat) => {
    fileCount++
    if (fileCount > 30) {
      walker.end()	// 1. terminate under an specific condition
      return
    }

    tick(walker)        // 2. tweak the processing frequency
    console.log(log_indent + '- ' + path)

  }).on('dir', (path, stat) => {
    if (log_indent.length >= 3) {
      walker.ignore()	// 3. skip at an specific depth ( or you can skip specific directories )
      return
    }

    tick(walker)
    console.log(log_indent + '> ' + path)

    log_indent = '\t' + log_indent
  }).on('pop', (path) => {
    log_indent = log_indent.substr(1)
  })
}, (complete) => {
  console.log('END: completed = ' + complete)
})

// performance cost by judgement
/*
(() => {
  console.time('if')
  walker = DirWalker()
  // note that the time cost differ significantly if we change the loop count largely,
  // for example, from 1e5 to 1e6, this confirm that the loop code is not optimized by v8.
  for(let i=0; i<1e5; i++) {
    if(walker._kickout()) {
      walker.pause()
    }
    if(walker.__sortfunc__) {
      walker.resume()
    }
  }
  console.timeEnd('if')
})()
*/
