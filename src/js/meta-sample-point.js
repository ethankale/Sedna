
let Vue = require('vue')
//let vSelect = require('vue-select');

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#spSelect").select2({ width: '100%' });
  $("#sample-point-siteSelect").select2({ width: '100%' });
});

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-sample-point',
  data: {
    spID: 2,
    sps: [],
    sites: [],
    locked: true,
    creatingNew: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Sample Point.",
    currentSP: {
      SamplePointID:            null,
      SiteID:                   null,
      Name:                     null,
      Description:              null,
      Latitude:                 null,
      Longitude:                null,
      ElevationFeet:            null,
      ElevationDatum:           null,
      ElevationReference:       null,
      LatLongAccuracyFeet:      null,
      LatLongDate:              null,
      LatLongDetails:           null,
      ElevationAccuracyFeet:    null,
      ElevationDate:            null,
      ElevationDetails:         null,
      WellType:                 null,
      WellCompletionType:       null,
      WellIntervalTopFeet:      null,
      WellIntervalBottomFeet:   null,
      WellInnerDiameterInches:  null,
      WellOuterDiameterInches:  null,
      WellStickupFeet:          null,
      WellStickupDate:          null,
      WellDrilledBy:            null,
      WellEcologyTagID:         null,
      WellEcologyStartCardID:   null,
      AddedOn:                  null,
      RemovedOn:                null,
      Active:                   null
    }
  },
  watch: {
    'currentSP.SiteID': function () {
      Vue.nextTick(function() {
        $('#sample-point-siteSelect').change();
      });
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
    
    $.ajax({
      url: `http://localhost:3000/api/v1/samplePointList`,
      method:'GET',
      timeout: 3000
    }).done(function(data) {
      self.sps = data;
      self.getCurrentSP(data[0].SamplePointID);
      self.spID = data[0].SamplePointID;
    }).fail(function(err) {
      console.log(err);
    });
    
    $.ajax({
      url: `http://localhost:3000/api/v1/getsites`,
      method:'GET',
      timeout: 3000
    }).done(function(data) {
      self.sites = data;
    }).fail(function(err) {
      console.log(err);
    });
  },
  methods: {
    getCurrentSP: function(SamplePointID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentSP = data;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Sample Point.";
      }).fail((err) => {
        console.log(err);
        this.notificationText = "Could not load the selected Sample Point.";
      }).always(() => {
        
      });
    },
    
    updateSP: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentSP),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.notificationText = "Could not update the Sample Point.  Please double-check the values.";
      });
    },
    
    newSPClick: function() {
      if (this.creatingNew) {
        this.saveNewSP();
      } else {
        this.editNewSP();
      };
    },
    
    editNewSP: function() {
      for (const prop in this.currentSP) {
        this.currentSP[prop] = null;
      };
      this.currentSP.Name = 'Default';
      this.creatingNew = true;
      this.locked = false;
    },
    
    saveNewSP: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentSP),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Sample Point!";
        this.spID = data;
        this.currentSP.SamplePointID = data;
        this.creatingNew = false;
      }).fail((err) => {
        console.log(err);
        this.notificationText = "Could not add the Sample Point.  Please double-check the values.";
      });
    },
    
    cancelNewSP: function() {
      this.getCurrentSP(this.spID);
      this.creatingNew = false;
      this.locked = true;
    },
    
    toggleLocked: function() {
      this.locked = this.locked ? false : true;
    }
    
  }
    
})

