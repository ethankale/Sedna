
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
    dirty: false,
    error: false,
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
        let isDirty = this.dirty;
        $('#sample-point-siteSelect').change();
        this.dirty = isDirty;
      });
    },
    
    currentSP: {
      handler(newVal, oldVal) {
        // Dirty shouldn't be set if switching to a new site, or adding a new site to the db.
        if ((oldVal.SamplePointID == newVal.SamplePointID) && 
            (newVal.SamplePointID != null) &&
            (oldVal.SamplePointID != null)) {
          this.dirty = true;
          this.notificationText = "Changes made; click 'Update' to save to the database."
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
    
    self.updateSamplePointList();
    
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
    updateSamplePointList: function(spID) {
      let active = $("#sample-point-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePointList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.sps = data;
        if (typeof spID === 'undefined') {
          this.getCurrentSP(data[0].SamplePointID);
          this.spID = data[0].SamplePointID;
        } else {
          this.spID = spID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentSP: function(SamplePointID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentSP = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Sample Point.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
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
        this.dirty = false;
        this.error = false;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
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
      this.currentSP.Name   = 'Default';
      this.currentSP.Active = true;
      this.creatingNew = true;
      this.locked = false;
      this.notificationText = "Fill in at least the site and name fields below.  'Save' to create new Sample Point."
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
        this.updateSamplePointList(this.spID);
        this.currentSP.SamplePointID = data;
        this.creatingNew = false;
        this.dirty = false;
        this.error = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Sample Point.  Please double-check the values.";
      });
    },
    
    cancelNewSP: function() {
      this.getCurrentSP(this.spID);
      this.creatingNew = false;
      this.locked = true;
      this.error = false;
    },
    
    toggleLocked: function() {
      this.locked = this.locked ? false : true;
    }
  }
})

