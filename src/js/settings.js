var alqwuutils = require('./utils.js');
let Vue        = require('vue');


Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

var vm = new Vue({
  el: '#settingsContent',
  
  data: {
    users: [],
    config: {
      mssql: {
        server: null,
        options: {
          database: null
        },
        authentication: {
          type: 'default',
          options: {
            userName: null,
            password: null
          }
        },
      },
      utcoffset: 8,
      userid: null
    },
    lastSave: new Date(),
    testStatus: null
  },
  
  mounted: function() {
    this.updateUserList();
    this.getConfig();
  },
  
  computed: {
    dirty: function() {
      let d = this.lastSave;
      // This is kind of hacky, but I didn't want to grab lodash just for this.
      return !(JSON.stringify(this.config) == JSON.stringify(window.getConfig()));
    },
    
    userid() {
      return this.config.userid;
    },
    
    testMessage() {
      let msg = "Click 'Test' to check the server settings."
      if (this.testStatus == 'success') {
        msg = "Successfully connected to database with these values."
      } else if (this.testStatus == 'fail') {
        msg = "Failed to connect to database with these values."
      } else if (this.testStatus == 'connecting') {
        msg = "Attempting to connect..."
      };
      return msg;
    }
    
  },
  
  watch: {
    userid: function(newid, oldid) {
      Vue.nextTick(() => {
        $("#userSelect").trigger('change');
      });
    }
  },
  
  methods: {
    getUserList() {
      let request = $.ajax({
        url: 'http://localhost:3000/api/v1/userList',
        method: 'GET',
        timeout: 3000
      });
      return request;
    },
    
    updateUserList() {
      this.getUserList()
        .done((data) => {
          this.users = data;
          //this.config.userid = data[0].UserID;
        })
        .fail((err) => {
          console.log(err);
        });
    },
    
    testServer() {
      this.testStatus = 'connecting';
      $.ajax({
        url: `http://localhost:3000/api/v1/test`,
        timeout: 1000
      }).done((data) => {
        this.testStatus = 'success';
      }).fail((err) => {
        this.testStatus = 'fail';
      });
    },
    
    getConfig() {
      let config = window.getConfig();
      this.config = config;
    },
    
    setConfig() {
      window.setConfig(this.config);
      this.lastSave = new Date();
    },
    
    cancelChanges() {
      this.config = window.getConfig();
    }
  }
});

$(document).ready(function() {
  
  $("#userSelect").select2({ width: '100%' });
  
  // let config = window.getConfig();
  
  // if (typeof config.mssql != 'undefined') {
    // fillServerSettingsForm(config.mssql);
  // }
  
  // Date/time events
  // $("#dt-utcoffset")
    // .val(config.utcoffset)
    // .on('input', () => {
      // config.utcoffset = $("#dt-utcoffset").val();
      // window.setConfig(config);
    // });
  
  
  // Server update events
  // $("#server-update").on('click', function() {
    // config.mssql = getServerSettingsFromForm();
    // window.setConfig(config);
    // $("#serverAlert")
      // .removeClass('alert-info alert-warning')
      // .addClass('alert-success')
      // .text("Updated server connection settings.");
    // $("#server-update").prop("disabled", true);
    // $("#server-test").prop("disabled", false);
  // });
  
  // $("#server-test").on('click', function() {
    // testDBConnection(getServerSettingsFromForm());
  // });
  
  // $("#server-serverName").on('change', () => { serverFormChange() });
  // $("#server-database").on('change', () => { serverFormChange() });
  // $("#server-userName").on('change', () => { serverFormChange() });
  // $("#server-password").on('change', () => { serverFormChange() });
  
});

// function serverFormChange() {
  // $("#serverAlert")
    // .removeClass('alert-info  alert-danger alert-success')
    // .addClass('alert-warning')
    // .text("Connection settings changed; don't forget to save them!");
  // $("#server-update").prop("disabled", false);
  // $("#server-test").prop("disabled", true);
// }

// function fillServerSettingsForm(mssqlConfig) {
  // $("#server-serverName").val(mssqlConfig.server);
  // $("#server-database").val(mssqlConfig.options.database);
  // $("#server-userName").val(mssqlConfig.authentication.options.userName);
  // $("#server-password").val(mssqlConfig.authentication.options.password);
// }

// function getServerSettingsFromForm() {
  // let mssqlConfig = {};
  
  // mssqlConfig.server = $("#server-serverName").val();
  // mssqlConfig.options = {};
  // mssqlConfig.options.database   = $("#server-database").val();
  // mssqlConfig.authentication = {};
  // mssqlConfig.authentication.type = 'default';
  // mssqlConfig.authentication.options = {};
  // mssqlConfig.authentication.options.userName   = $("#server-userName").val();
  // mssqlConfig.authentication.options.password   = $("#server-password").val();
  
  // return mssqlConfig;
// }

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


