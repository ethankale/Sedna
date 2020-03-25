(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var alqwuutils = require('./utils.js');
var utcoffset = 8;

$(document).ready(function() {
  let config = window.getConfig();
  
  if (typeof config.mssql != 'undefined') {
    fillServerSettingsForm(config.mssql);
  }
  
  $("#server-update").on('click', function() {
    config.mssql = getServerSettingsFromForm();
    window.setConfig(config);
    $("#serverAlert")
      .removeClass('alert-info alert-warning')
      .addClass('alert-success')
      .text("Updated server connection settings.");
    $("#server-update").prop("disabled", true);
    $("#server-test").prop("disabled", false);
  });
  
  $("#server-test").on('click', function() {
    testDBConnection(getServerSettingsFromForm());
  });
  
  $("#server-serverName").on('change', () => { serverFormChange() });
  $("#server-database").on('change', () => { serverFormChange() });
  $("#server-userName").on('change', () => { serverFormChange() });
  $("#server-password").on('change', () => { serverFormChange() });
  
});

function serverFormChange() {
  $("#serverAlert")
    .removeClass('alert-info  alert-danger alert-success')
    .addClass('alert-warning')
    .text("Connection settings changed; don't forget to save them!");
  $("#server-update").prop("disabled", false);
  $("#server-test").prop("disabled", true);
}

function fillServerSettingsForm(mssqlConfig) {
  $("#server-serverName").val(mssqlConfig.server);
  $("#server-database").val(mssqlConfig.options.database);
  $("#server-userName").val(mssqlConfig.authentication.options.userName);
  $("#server-password").val(mssqlConfig.authentication.options.password);
}

function getServerSettingsFromForm() {
  let mssqlConfig = {};
  
  mssqlConfig.server = $("#server-serverName").val();
  mssqlConfig.options = {};
  mssqlConfig.options.database   = $("#server-database").val();
  mssqlConfig.authentication = {};
  mssqlConfig.authentication.type = 'default';
  mssqlConfig.authentication.options = {};
  mssqlConfig.authentication.options.userName   = $("#server-userName").val();
  mssqlConfig.authentication.options.password   = $("#server-password").val();
  
  return mssqlConfig;
}

function testDBConnection(mssqlConfig) {
  
  $.ajax({
    url: `http://localhost:3000/api/v1/test`,
    timeout: 1000
  }).done(function(data) {
    $("#serverAlert")
      .removeClass('alert-info alert-warning alert-danger')
      .addClass('alert-success')
      .text("Successfully tested the server connection settings.");
  }).fail(function(err) {
    $("#serverAlert")
      .removeClass('alert-info alert-success alert-warning')
      .addClass('alert-danger')
      .text("Could not connect to database server; change settings and try again.");
  });
}



},{"./utils.js":2}],2:[function(require,module,exports){

exports.calcWaterYear = function(dt) {
    var year = dt.getFullYear()
    var mon  = dt.getMonth()
    
    // Zero-indexed months; 8 = September
    return(mon > 8 ? year+1 : year)
}

exports.createWYList = function(startdt, enddt) {
    var startwy = exports.calcWaterYear(startdt)
    var endwy   = exports.calcWaterYear(enddt)
    var wylist  = [];
    var currwy = startwy;
    
    while(currwy <= endwy) {
        wylist.push(currwy);
        currwy = currwy+1;
    };
    return(wylist);
}

exports.formatDateForSQL = function(dt) {
    let months  = dt.getMonth()+1;
    let days    = dt.getDay();
    let hours   = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();
    
    months  = months  < 10 ? '0'+months  : months;
    days    = days    < 10 ? '0'+days    : days;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    
    var strTime = hours + ':' + minutes + ':' + seconds;
    var strDate = dt.getFullYear() + "-" + months + "-" + days;
    return  strDate + " " + strTime;
}

var utcoffset = -8;

exports.utcoffset   = utcoffset;             // Difference between local and UTC
exports.utcoffsetjs = utcoffset*60*60*1000;  // UTC offset in milliseconds

},{}]},{},[1]);
