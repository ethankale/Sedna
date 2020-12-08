
let alqwuutils = require('./utils.js');
let Vue        = require('vue')
let $          = require('jquery');
let select2    = require('select2');

import NewEditCancel from './new-edit-cancel.vue';

let utcoffset  = alqwuutils.utcoffset;

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#methodSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-method',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    methods: [],
    MethodID: null,
    
    graphTypes:  [],
    
    editstate: 'view',
    error:     false,
    
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Method.",
    currentMethod: {
      MethodID:    null,
      Code:        null,
      Description: null,
      Reference:   null,
      GraphTypeID: 1
    }
  },
  
  mounted: function () {
    let self = this;
    
    self.updateMethodList();
    this.getGraphTypes()
      .done((data) => {
        this.graphTypes = data;
      })
      .fail((err) => {
        console.log("Couldn't load graph types.");
        console.log(err);
      });
  },
  
  methods: {
    updateMethodList: function(MethodID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/methodList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.methods = data;
        if (typeof MethodID === 'undefined') {
          this.getCurrentMethod(data[0].MethodID);
          this.MethodID = data[0].MethodID;
        } else {
          this.MethodID = MethodID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getGraphTypes() {
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/graphTypeList`,
        method: 'GET',
        timeout: 3000,
        dataType: 'json',
        contentType: 'application/json'
      });
      return request;
    },
    
    getCurrentMethod: function(MethodID) {
      this.editstate = 'view';
      $.ajax({
        url: `http://localhost:3000/api/v1/method?MethodID=${MethodID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentMethod = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Method.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Method.";
      }).always(() => {
      });
    },
    
    updateMethod: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/method`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentMethod),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.error  = false;
        this.editstate = 'view';
        this.notificationText = "Successfully updated!";
        this.updateMethodList(this.MethodID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Method.  Please double-check the values.";
      });
    },
    
    clickNewMethod: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewMethod();
      } else {
        this.saveNewMethod();
      };
    },
    
    editNewMethod: function() {
      for (const prop in this.currentMethod) {
        this.currentMethod[prop] = null;
      };
      this.notificationText   = "Fill in fields below.  'Save' to create new Method."
    },
    
    saveNewMethod: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/method`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentMethod),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Method!";
        this.MethodID = data;
        this.updateMethodList(this.MethodID);
        this.currentMethod.MethodID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Method.  Please double-check the values.";
      });
    },
    
    clickCancelMethod: function() {
      this.getCurrentMethod(this.MethodID);
      
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditMethod: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateMethod();
      };
    },
  }
})

