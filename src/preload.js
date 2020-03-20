const { writeFileSync }    = require('fs')
const { readFileSync } = require('fs')
const { dialog }       = require('electron').remote;

window.writeText = function (text, filepath) {
  /*
  var result = writeFileSync(filepath, text, function(err) {
    if(err) {
      window.writeFileStatus = "Fail"
      //throw err;
    } else {
      window.writeFileStatus = "Success"
    }
  });
  */
  
  try {
      writeFileSync(filepath, text)
      window.writeFileStatus = "Success";
  } catch(err) {
      //console.log(err);
      window.writeFileStatus = "Fail";
  }
}

window.writeFileStatus = "Success";

window.openCSV = function() {
    var path = dialog.showOpenDialogSync({
        title: 'Select CSV',
        properties: ['openFile']
    })[0];
    
    console.log(path);
    var data = readFileSync(path, "utf8").trim();
    return [path, data];
}

