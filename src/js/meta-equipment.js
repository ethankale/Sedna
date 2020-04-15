
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
  $("#eqSelect").select2({ width: '100%' });
  $("#equipment-modelSelect").select2({ width: '100%' });
});

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-equipment',
  data: {
    eqID: null,
    eqs: [],
    models: [],
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: `Click 'Edit' below to make changes, or 'New' to create a new Equipment.`,
    currentEQ: {
      EquipmentID:         null,
      EquipmentModelID:    null,
      SerialNumber:        null,
      LastCalibrationDate: null,
      Notes:               null,
      Active:              null
    },
  },
  
  watch: {
    'currentEQ.EquipmentModelID': function () {
      Vue.nextTick(function() {
        $('#equipment-modelSelect').change();
      });
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
    let self = this;
    this.updateEquipmentList();
    
    $.ajax({
      url: `http://localhost:3000/api/v1/equipmentModelList`,
      method:'GET',
      timeout: 3000
    }).done(function(data) {
      self.models = data;
    }).fail(function(err) {
      console.log(err);
    });
  },
  
  filters: {
    dateStringToInput: function(dt) {
      let jsDT = new Date(dt);
      return(jsDT.getFullYear() + "-" + (jsDT.getMonth()+1) + "-" + jsDT.getDate());
    }
  },
  
  methods: {
    updateEquipmentList: function(eqID) {
      let active = $("#equipment-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/equipmentList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.eqs = data;
        // Initial load
        if (typeof eqID === 'undefined') {
          this.getCurrentEQ(data[0].EquipmentID);
          this.eqID = data[0].EquipmentID;
        // Subsequent updates
        } else {
          this.eqID = eqID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentEQ: function(EquipmentID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/equipment?equipmentid=${EquipmentID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentEQ = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = `Click 'Edit' below to make changes, or 'New' to create a new Equipment .`;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Equipment .";
      }).always(() => {
        
      });
    },
    
    updateEQ: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/equipment`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentEQ),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Equipment.  Please double-check the values.";
      });
    },
    
    newEQClick: function() {
      if (this.creatingNew) {
        this.saveNewEQ();
      } else {
        this.editNewEQ();
      };
    },
    
    editNewEQ: function() {
      for (const prop in this.currentEQ) {
        this.currentEQ[prop] = null;
      };
      this.currentEQ.Active = true;
      this.creatingNew = true;
      this.locked = false;
      this.notificationText = "Fill in at least the site and name fields below.  'Save' to create new Equipment ."
    },
    
    saveNewEQ: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/equipment`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentEQ),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Equipment !";
        this.eqID = data;
        this.updateEquipmentList(this.eqID);
        this.currentEQ.EquipmentID = data;
        this.creatingNew = false;
        this.dirty = false;
        this.error = false;
        this.locked = true;
        //this.updateEQ();  //This is exclusively to set Dirty to false.  Need a better way.
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the Equipment .  Please double-check the values.";
      });
    },
    
    cancelEQ: function() {
      this.getCurrentEQ(this.eqID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditEQ: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateEQ();
      }
    }
  }
})

