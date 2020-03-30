
let Vue = require('vue')
//let vSelect = require('vue-select');

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      // v-model looks for
      //  - an event named "change"
      //  - a value with property path "$event.target.value"
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#spSelect").select2({ width: '100%' });
});

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-sample-point',
  data: {
    notice: 'Vue is working!',
    spID: 2,
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
    },
    sps: []
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
    }).fail(function(err) {
      console.log(err);
    });
  },
  methods: {
    getCurrentSP: function(SamplePointID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done(function(data) {
        this.currentSP = data;
      }).fail(function(err) {
        console.log(err);
      });
    },
    updateSP: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done(function(data) {
        this.currentSP = data;
      }).fail(function(err) {
        console.log(err);
      });
    }
  }
    
})

