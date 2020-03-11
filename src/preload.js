const { writeFile }    = require('fs')
const { readFileSync } = require('fs')
const { dialog }       = require('electron').remote;

window.writeText = function (text, filepath) {
  var result = writeFile(filepath, text, function(err) {
    if(err) {
      throw err;
    }
  });
}

window.openCSV = function() {
    var path = dialog.showOpenDialogSync({
        title: 'Select CSV',
        properties: ['openFile']
    })[0];
    
    console.log(path);
    var data = readFileSync(path, "utf8").trim();
    return [path, data];
}

