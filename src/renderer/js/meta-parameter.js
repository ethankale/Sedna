
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
  $("#paramSelect").select2({ width: '100%' });
  // $("#parameter-GraphDefaultSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-parameter',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    params:      [],
    ParameterID: 0,
    
    graphTypes:  [],
    
    editstate:   'view',
    error:       false,
    
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Parameter.",
    currentParameter: {
      ParameterID: null,
      Name:        null,
      CAS:         null,
      Description: null,
      GraphTypeID: 1
    }
  },
  
  mounted: function () {
    this.updateParameterList();
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
    updateParameterList: function(ParameterID) {
      let active = $("#parameter-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/parameterList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.params = data;
        if (typeof ParameterID === 'undefined') {
          this.getCurrentParameter(data[0].ParameterID);
          this.ParameterID = data[0].ParameterID;
        } else {
          this.ParameterID = ParameterID;
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
    
    getCurrentParameter: function(ParameterID) {
      this.editstate = 'view';
      if (typeof ParameterID === 'undefined') {
        ParameterID = typeof this.params[0].ParameterID === 'undefined'? 0 : this.params[0].ParameterID;
      };
      
      $.ajax({
        url: `http://localhost:3000/api/v1/parameter?ParameterID=${ParameterID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentParameter = data;
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Parameter.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Parameter.";
      }).always(() => {
      });
    },
    
    updateParameter: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/parameter`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentParameter),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.editstate = 'view';
        this.error     = false;
        this.notificationText = "Successfully updated!";
        this.updateParameterList(this.ParameterID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Parameter.  Please double-check the values.";
      });
    },
    
    clickNewParameter: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewParameter();
      } else {
        this.saveNewParameter();
      };
    },
    
    editNewParameter: function() {
      for (const prop in this.currentParameter) {
        this.currentParameter[prop] = null;
      };
      this.notificationText   = "Fill in fields below.  'Save' to create new Parameter."
    },
    
    saveNewParameter: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/parameter`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentParameter),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Parameter!";
        this.ParameterID = data;
        this.updateParameterList(this.ParameterID);
        this.currentParameter.ParameterID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Parameter.  Please double-check the values.";
      });
    },
    
    clickCancelParameter: function() {
      this.getCurrentParameter(this.ParameterID);
      
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditParameter: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateParameter();
      };
    },
  }
})

