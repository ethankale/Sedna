
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
  $("#unitSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-unit',
  data: {
    units: [],
    UnitID: 0,
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Unit.",
    currentUnit: {
      UnitID:      null,
      Symbol:      null,
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
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/unit?UnitID=${UnitID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentUnit = data;
        this.dirty = false;
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
      console.log(JSON.stringify(this.currentUnit));
      $.ajax({
        url: `http://localhost:3000/api/v1/unit`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentUnit),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
        this.updateUnitList(this.UnitID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Unit.  Please double-check the values.";
      });
    },
    
    newUnitClick: function() {
      if (this.creatingNew) {
        this.saveNewUnit();
      } else {
        this.editNewUnit();
      };
    },
    
    editNewUnit: function() {
      for (const prop in this.currentUnit) {
        this.currentUnit[prop] = null;
      };
      this.creatingNew        = true;
      this.locked             = false;
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
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Unit.  Please double-check the values.";
      });
    },
    
    cancelUnit: function() {
      this.getCurrentUnit(this.UnitID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditUnit: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateUnit();
      }
    },
  }
})

