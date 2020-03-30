
var Vue = require('vue')

$(document).ready(function() {
  $("#spSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-sample-point',
  data: {
    notice: 'Vue is working!',
    samplePointID: -1,
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
      self.samplePointID = data[0].SamplePointID;
    }).fail(function(err) {
      console.log(err);
    });
  }
})

