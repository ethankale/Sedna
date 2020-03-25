var alqwuutils = require('./utils.js');

$(document).ready(function() {
  let config = window.getConfig();
  
  if (typeof config.mssql != 'undefined') {
    fillServerSettingsForm(config.mssql);
  }
  
  // Date/time events
  $("#dt-utcoffset")
    .val(config.utcoffset)
    .on('input', () => {
      config.utcoffset = $("#dt-utcoffset").val();
      window.setConfig(config);
    });
  
  // Server update events
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


