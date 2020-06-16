
let Vue = require('vue')

import NewEditCancel from './new-edit-cancel.vue';

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

var vm = new Vue({
  el: '#v-pills-equipmentModel',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    emID: null,
    ems: [],
    
    editstate: 'view',
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
      this.editstate = 'view';
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentModel?equipmentmodelid=${EquipmentModelID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentEM = data;
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
        this.error     = false;
        this.editstate = 'view';
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Equipment Model.  Please double-check the values.";
      });
    },
    
    clickNewEM: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewEM();
      } else {
        this.saveNewEM();
      };
    },
    
    editNewEM: function() {
      for (const prop in this.currentEM) {
        this.currentEM[prop] = null;
      };
      this.currentEM.Active = true;
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
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the Equipment Model.  Please double-check the values.";
      });
    },
    
    clickCancelEM: function() {
      this.getCurrentEM(this.emID);
      
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditEM: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateEM();
      };
    }
  }
})

