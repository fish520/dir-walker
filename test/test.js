var DirWalker = require('../index');

function fsApi(path, init, callback) {
    var walker = new DirWalker(path);
    init(walker);
    walker.once("end", callback);
}

var log_indent = "";

fsApi("D:\\SDK\\Ant\\etc", function init(walker){
    walker.on("file", function (path, stat){
        walker.pause();
        setTimeout(function(){walker.resume()}, 100);  // print a file every 100ms
        console.log(log_indent + path);
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
