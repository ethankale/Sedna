
let alqwuutils     = require('./utils.js');
let Vue = require('vue')

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
});

var vm = new Vue({
  el: '#v-pills-parameter',
  data: {
    params: [],
    ParameterID: 0,
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Parameter.",
    currentParameter: {
      ParameterID: null,
      Name:        null,
      CAS:         null,
      Description: null
    }
  },
  computed: {
    editButtonText: function() {
      return this.locked ? 'Edit' : 'Save';
    },
    
    newButtonText: function() {
      return this.creatingNew ? 'Save' : 'New';
    }
  },
  mounted: function () {
    let self = this;
    
    self.updateParameterList();
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
    
    getCurrentParameter: function(ParameterID) {
      this.locked = true;
      if (typeof ParameterID === 'undefined') {
        ParameterID = typeof this.params[0].ParameterID === 'undefined'? 0 : this.params[0].ParameterID;
      };
      
      $.ajax({
        url: `http://localhost:3000/api/v1/parameter?ParameterID=${ParameterID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentParameter = data;
        this.dirty = false;
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
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
        this.updateParameterList(this.ParameterID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Parameter.  Please double-check the values.";
      });
    },
    
    newParameterClick: function() {
      if (this.creatingNew) {
        this.saveNewParameter();
      } else {
        this.editNewParameter();
      };
    },
    
    editNewParameter: function() {
      for (const prop in this.currentParameter) {
        this.currentParameter[prop] = null;
      };
      this.creatingNew        = true;
      this.locked             = false;
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
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Parameter.  Please double-check the values.";
      });
    },
    
    cancelParameter: function() {
      this.getCurrentParameter(this.ParameterID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditParameter: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateParameter();
      }
    },
  }
})

