const { writeFile } = require('fs')

window.writeText = function (text, filepath) {
  var result = writeFile(filepath, text, function(err) {
    if(err) {
      throw err;
    }
  });
}
