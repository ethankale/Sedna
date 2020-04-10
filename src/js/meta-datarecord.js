
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
    changingMetas: false,
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
    
    currentDR: {
      handler(newVal, oldVal) {
        // Dirty shouldn't be set if switching to a new site, or adding a new site to the db.
        if ((oldVal.MetadataID == newVal.MetadataID) && 
            (newVal.MetadataID != null) &&
            (oldVal.MetadataID != null) &&
            (this.changingMetas == false)) {
          this.dirty = true;
          this.notificationText = "Changes made; click 'Update' to save to the database."
        } else {
          this.changingMetas = false;
        }
      },
      deep: true
    }
  },
  computed: {
    editButtonText: function() {
      return this.locked ? 'Edit' : 'Lock';
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
      this.changingMetas = true;
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
      this.currentDR.Name   = 'Default';
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
        this.dirty = false;
        this.error = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Data Record.  Please double-check the values.";
      });
    },
    
    getEquipmentDeployments: function(metaid) {
      let url = `http://localhost:3000/api/v1/equipmentDeploymentList?MetadataID=${metaid}`;
      let self = this;
      $.ajax({
        url: url,
        method:'GET',
        timeout: 3000
      }).done(function(data) {
        self.currentDR.equipDeployments = data;
      }).fail(function(err) {
        console.log(err);
      });
    },
    
    cancelNewDR: function() {
      this.getCurrentDR(this.drID);
      this.creatingNew = false;
      this.locked = true;
      this.error = false;
    },
    
    toggleLocked: function() {
      this.locked = this.locked ? false : true;
    }
  }
})

