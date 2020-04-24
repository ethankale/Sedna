
let Vue  = require('vue');

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#oldDRSelect").select2({ width: '100%' });
  $("#newDRSelect").select2({ width: '100%' });
  $("#conversionTableSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-conversion',
  
  data: {
    oldDRID: null,
    newDRID: null,
    ConversionID: null,
    fromDate: null,
    toDate: null,
    conversions: [],
    drs: [],
    converting: false,
    error: false,
    notificationText: "Select a data record to calculate from, one to save new data to, a conversion table, and a timeframe."
  },
  
  mounted: function () {
    this.loadDRs();
    this.loadConversions();
  },
  
  computed: {
    convertButtonText: function() {
      return this.converting ? "Save" : "Start";
    }
  },
  
  methods: {
    loadDRs: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/metadataList?active=1`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.drs = data;
        if (this.oldDRID == null) {
          this.oldDRID = data[0].MetadataID;
        };
        if (this.newDRID == null) {
          this.newDRID = data[0].MetadataID;
        };
      }).fail((err) => {
        console.log(err);
      });
    },
    
    loadConversions: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/conversionList?active=1`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.conversions = data;
        // Initial load
        if (this.ConversionID == null) {
          this.ConversionID = data[0].ConversionID;
        // Subsequent updates
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    clickConvert: function() {
      if (this.converting) {
        this.notificationText = "Saving conversion.";
        this.converting = false;
      } else {
        this.notificationText = "Starting conversion.";
        this.converting = true;
      }
    },
    
    cancelConversion: function() {
      this.notificationText = "Cancelled conversion.";
      this.converting = false;
    }
  }
  
});