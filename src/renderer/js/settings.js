var alqwuutils = require('./utils.js');
let Vue        = require('vue');
let $          = require('jquery');
let select2    = require('select2');
let bootstrap  = require('bootstrap');

import 'bootstrap/dist/css/bootstrap.min.css';
import 'select2/dist/css/select2.min.css';

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
      utcoffset: -8,
      userid: null,
      userDefaultPath: 'c:/data/'
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
    },
    
    testError() {
      return this.testStatus === 'fail' ? true : false;
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
      if (typeof(config) !== 'undefined') {
        this.config = {...this.config, ...config};
      };
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
});

