
let Vue = require('vue')

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#emSelect").select2({ width: '100%' });
});

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-equipmentModel',
  data: {
    emID: null,
    ems: [],
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: `Click 'Edit' below to make changes, or 'New' to create a new Equipment Model.`,
    currentEM: {
      EquipmentModelID: null,
      Name:             null,
      Manufacturer:     null,
      Description:      null,
      Active:           null,
      equipmentCount:   0
    },
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
    this.updateEquipmentModelList();
  },
  
  methods: {
    updateEquipmentModelList: function(emID) {
      let active = $("#equipmentModel-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentModelList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.ems = data;
        // Initial load
        if (typeof emID === 'undefined') {
          this.getCurrentEM(data[0].EquipmentModelID);
          this.emID = data[0].EquipmentModelID;
        // Subsequent updates
        } else {
          this.emID = emID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentEM: function(EquipmentModelID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentModel?equipmentmodelid=${EquipmentModelID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentEM = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = `Click 'Edit' below to make changes, or 'New' to create a new Equipment Model.`;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Equipment Model.";
      }).always(() => {
        
      });
    },
    
    updateEM: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentModel`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentEM),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty  = false;
        this.error  = false;
        this.locked = false;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Equipment Model.  Please double-check the values.";
      });
    },
    
    newEMClick: function() {
      if (this.creatingNew) {
        this.saveNewEM();
      } else {
        this.editNewEM();
      };
    },
    
    editNewEM: function() {
      for (const prop in this.currentEM) {
        this.currentEM[prop] = null;
      };
      this.currentEM.Active = true;
      this.creatingNew = true;
      this.locked = false;
      this.notificationText = "Fill in at least the site and name fields below.  'Save' to create new Equipment Model."
    },
    
    saveNewEM: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentModel`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentEM),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Equipment Model!";
        this.emID = data;
        this.updateEquipmentModelList(this.emID);
        this.currentEM.EquipmentModelID = data;
        this.creatingNew = false;
        this.dirty  = false;
        this.error  = false;
        this.locked = false;
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the Equipment Model.  Please double-check the values.";
      });
    },
    
    cancelEM: function() {
      this.getCurrentEM(this.emID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditEM: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateEM();
      }
    }
  }
})

