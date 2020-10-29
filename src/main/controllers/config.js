// This is for user-specific configuration values.
//   The DBOption table holds the database-wide configuration values.

const { readFileSync } = require('fs')
const { app }          = require('electron');

let configFileName = 'alqwuconfig.json'

exports.getConfig = function() {
  let configPath = app.getPath('userData') + '\\' + configFileName;
  try {
    let config = JSON.parse(readFileSync(configPath, "utf8"));
    return config;
  } catch(err) {
    //console.log(err);
    return {};
  }
};



