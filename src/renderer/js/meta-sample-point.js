
let Vue        = require('vue')
let $          = require('jquery');
let select2    = require('select2');

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
  $("#spSelect").select2({ width: '100%' });
  $("#sample-point-siteSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-sample-point',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    spID: null,
    sps: [],
    sites: [],
    
    error: false,
    editstate: 'view',
    
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
    },
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
      this.changingSPs = true;
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
      SamplePointID = typeof SamplePointID == 'undefined' ? this.sites[0].SamplePointID : SamplePointID;
      this.editState = 'view';
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.error = false;
        this.editstate = 'view';
        this.currentSP = data;
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
        this.error     = false;
        this.editstate = 'view';
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Sample Point.  Please double-check the values.";
      });
    },
    
    clickNewSP: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewSP();
      } else {
        this.saveNewSP();
      };
    },
    
    editNewSP: function() {
      for (const prop in this.currentSP) {
        this.currentSP[prop] = null;
      };
      this.currentSP.Name   = 'Default';
      this.currentSP.Active = true;
      
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
        
        this.error       = false;
        this.editstate = 'view';
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Sample Point.  Please double-check the values.";
      });
    },
    
    clickCancelSP: function() {
      this.getCurrentSP(this.spID);
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditSP: function() {
      if (this.editstate === 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateSP();
      };
    },
  }
})

