
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
  $("#metadataSelect").select2(     { width: '100%' });
  $("#dr-samplePoint").select2(     { width: '100%', disabled: true });
  $("#dr-parameter").select2(       { width: '100%', disabled: true });
  $("#dr-method").select2(          { width: '100%', disabled: true });
  $("#dr-unit").select2(            { width: '100%', disabled: true });
  $("#dr-equipmentSelect").select2( { width: '100%', disabled: true });
});

var vm = new Vue({
  el: '#v-pills-datarecord',
  data: {
    drID: 2,
    drs: [],
    sps: [],
    params: [],
    methods: [],
    units: [],
    equipment: [],
    locked: true,
    creatingNew: false,
    changingMetas: 0,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Data Record.",
    currentDR: {
      MetadataID:       null,
      ParameterID:      null,
      MethodID:         null,
      UnitID:           null,
      SamplePointID:    null,
      FrequencyMinutes: null,
      DecimalPoints:    null,
      Notes:            null,
      Active:           null,
      equipDeployments: []
    }
  },
  watch: {
    'currentDR.SamplePointID': function () {
      Vue.nextTick(function() {
        $('#dr-samplePoint').change();
      });
    },
    'currentDR.ParameterID': function () {
      Vue.nextTick(function() {
        $('#dr-parameter').change();
      });
    },
    'currentDR.MethodID': function () {
      Vue.nextTick(function() {
        $('#dr-method').change();
      });
    },
    'currentDR.UnitID': function () {
      Vue.nextTick(function() {
        $('#dr-unit').change();
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
    
    self.updateMetadataList();
    
    let lists     = ["sps", "params", "methods", "units", "equipment"]
    let endpoints = ["samplePointList", "parameterList", 
                     "methodList", "unitList", "equipmentList"]
    
    for (let i=0; i<lists.length; i++) {
      
      $.ajax({
        url: `http://localhost:3000/api/v1/${endpoints[i]}`,
        method:'GET',
        timeout: 3000
      }).done(function(data) {
        self[lists[i]] = data;
      }).fail(function(err) {
        console.log(err);
      });
    };
  },
  methods: {
    updateMetadataList: function(drID) {
      this.changingMetas += 1;
      console.log("updateMetadataList; " + this.changingLookups);
      let active = $("#dr-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/metadataList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.drs = data;
        if (typeof drID === 'undefined') {
          this.getCurrentDR(data[0].MetadataID);
          this.drID = data[0].MetadataID;
        } else {
          this.drID = drID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentDR: function(MetadataID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/metadataDetails?metadataid=${MetadataID}&utcoffset=${utcoffset}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentDR = data[0];
        console.log("getCurrentDR");
        this.getEquipmentDeployments(this.currentDR.MetadataID);
        this.dirty = false;
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Data Record.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Data Record.";
      }).always(() => {
      });
    },
    
    updateDR: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/metadata`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentDR),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty = false;
        this.error = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Data Record.  Please double-check the values.";
      });
    },
    
    newDRClick: function() {
      if (this.creatingNew) {
        this.saveNewDR();
      } else {
        this.editNewDR();
      };
    },
    
    editNewDR: function() {
      for (const prop in this.currentDR) {
        this.currentDR[prop] = null;
      };
      this.currentDR.Active = true;
      this.creatingNew = true;
      this.locked = false;
      this.notificationText = "Fill in fields below.  'Save' to create new Data Record."
    },
    
    saveNewDR: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/metadata`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentDR),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Data Record!";
        this.drID = data;
        this.updateMetadataList(this.drID);
        this.currentDR.MetadataID = data;
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Data Record.  Please double-check the values.";
      });
    },
    
    getEquipmentDeployments: function(metaid) {
      this.changingLookups += 1;
      console.log("getEquipmentDeployments; " + this.changingLookups);
      let url = `http://localhost:3000/api/v1/equipmentDeploymentList?MetadataID=${metaid}`;
      $.ajax({
        url: url,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        // Using Vue.set instead of just assigning so that Vue knows a change was made.
        Vue.set(this.currentDR, 'equipDeployments', data);
      }).fail((err) => {
        console.log(err);
      }).always(() => {
        this.changingLookups = this.changingLookups < 1 ? 0 : this.changingLookups-1;
      });
    },
    
    addEquipment: function() {
      let EquipmentID = $("#dr-equipmentSelect").val();
      let MetadataID = this.currentDR.MetadataID;
      let deployment = {'EquipmentID': EquipmentID, 'MetadataID': MetadataID};
      $.ajax({
        url: 'http://localhost:3000/api/v1/equipmentDeployment',
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(deployment),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.error = false;
        this.notificationText = "Added a new piece of equipment to this data record."
        this.getEquipmentDeployments(MetadataID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add Equipment.";
      });
    },
    
    deleteEquipment: function(EquipmentDeploymentID) {
      let requestBody = {'EquipmentDeploymentID': EquipmentDeploymentID};
      $.ajax({
        url: 'http://localhost:3000/api/v1/equipmentDeployment',
        method:'DELETE',
        timeout: 3000,
        data: JSON.stringify(requestBody),
        dataType: 'json',
        contentType: 'application/json'
      }).done(() => {
        this.getEquipmentDeployments(this.currentDR.MetadataID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not delete Equipment from this Deployment.";
      });
    },
    
    cancelDR: function() {
      this.getCurrentDR(this.drID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditDR: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateDR();
      }
    },
  }
})

