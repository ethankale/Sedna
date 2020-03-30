
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
      SamplePointID: 2, 
      Name: 'Loading...'
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
      let self = this;
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePoint?samplepointid=${SamplePointID}`,
        method:'GET',
        timeout: 3000
      }).done(function(data) {
        self.currentSP = data;
        console.log(self.currentSP);
      }).fail(function(err) {
        console.log(err);
      });
    }
  }
    
})

