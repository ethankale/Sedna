
let alqwuutils     = require('./utils.js');
let Vue = require('vue');

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
  $("#unitSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-unit',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    units: [],
    UnitID: 0,
    
    editstate: 'view',
    error:     false,
    
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Unit.",
    currentUnit: {
      UnitID:      null,
      Symbol:      null,
      Description: null
    }
  },
  
  mounted: function () {
    this.updateUnitList();
  },
  
  methods: {
    updateUnitList: function(UnitID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/unitList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.units = data;
        if (typeof UnitID === 'undefined') {
          this.getCurrentUnit(data[0].UnitID);
          this.UnitID = data[0].UnitID;
        } else {
          this.UnitID = UnitID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentUnit: function(UnitID) {
      UnitID = typeof UnitID == 'undefined' ? units[0].UnitID : UnitID;
      $.ajax({
        url: `http://localhost:3000/api/v1/unit?UnitID=${UnitID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentUnit = data;
        this.editstate = 'view';
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Unit.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Unit.";
      }).always(() => {
      });
    },
    
    updateUnit: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/unit`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentUnit),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.editstate = 'view';
        this.error     = false;
        this.notificationText = "Successfully updated!";
        this.updateUnitList(this.UnitID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Unit.  Please double-check the values.";
      });
    },
    
    clickNewUnit: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewUnit();
      } else {
        this.saveNewUnit();
      };
    },
    
    editNewUnit: function() {
      for (const prop in this.currentUnit) {
        this.currentUnit[prop] = null;
      };
      this.notificationText   = "Fill in fields below.  'Save' to create new Unit."
    },
    
    saveNewUnit: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/unit`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentUnit),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Unit!";
        this.UnitID = data;
        this.updateUnitList(this.UnitID);
        this.currentUnit.UnitID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Unit.  Please double-check the values.";
      });
    },
    
    clickCancelUnit: function() {
      this.getCurrentUnit(this.UnitID);
      
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditUnit: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateUnit();
      };
    }
  }
})

