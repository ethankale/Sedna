const { writeFileSync, readFileSync } = require('fs')
const { dialog, app }                 = require('electron').remote;

const configFileName = 'alqwuconfig.json';

window.writeText = function (text, filepath) {
  try {
      writeFileSync(filepath, text)
      window.writeFileStatus = "Success";
  } catch(err) {
      //console.log(err);
      window.writeFileStatus = "Fail";
  }
};

window.writeFileStatus = "Success";

window.openCSV = function() {
    var path = dialog.showOpenDialogSync({
        title: 'Select CSV',
        properties: ['openFile']
    })[0];
    
    console.log(path);
    var data = readFileSync(path, "utf8").trim();
    return [path, data];
};

window.getConfig = function() {
  let configPath = app.getPath('userData') + '\\' + configFileName;
  try {
    let config = JSON.parse(readFileSync(configPath, "utf8"));
    return config;
  } catch(err) {
    //console.log(err);
    return {};
  }
};

window.setConfig = function(config) {
  let configPath = app.getPath('userData') + '\\' + configFileName;
  try {
    writeFileSync(configPath, JSON.stringify(config));
    return "Success";
  } catch(err) {
    console.log(err);
    return "Fail";
  }
};


