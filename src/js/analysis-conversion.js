
let Vue  = require('vue');
let Datetime = require('vue-datetime');

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
    measurements: [],
    nulls: 0,
    valids: 0,
    converting: false,
    conversionState: 'initial',
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
    },
    
    convertButtonDisable: function() {
      let st = this.conversionState;
      return st == 'loading';
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
    
    getConvertRecordStats: function() {
      this.conversionState = 'loading';
      let query = {
        'ConversionID': this.ConversionID,
        'MetadataID': this.oldDRID,
        'FromDate': this.fromDate,
        'ToDate': this.toDate
      }
      $.ajax({
        url: `http://localhost:3000/api/v1/conversionStats`,
        data: query,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        if (data.count_valid > 0) {
          this.nulls  = data.count_nulls;
          this.valids = data.count_valid;
          this.conversionState = 'statsLoaded';
          this.notificationText = `Valid measurements to convert: ${this.valids}; non-matching records: ${this.nulls}`;
          this.getConvertedMeasurements();
        } else {
          this.conversionState = 'initial';
          this.notificationText = 'No records found matching that date range and conversion table.'
        }
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Failed to retrieve stats for this data record."
      });
    },
    
    getConvertedMeasurements: function() {
      this.conversionState = 'loading';
      let query = {
        'MetadataID':   this.oldDRID,
        'ConversionID': this.ConversionID,
        'FromDate':     this.fromDate,
        'ToDate':       this.toDate
      }
      $.ajax({
        url: `http://localhost:3000/api/v1/convertMeasurements`,
        data: query,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.measurements = data;
        this.conversionState = 'calculated';
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.conversionState = 'ready';
        this.notificationText = "Error attempting to convert old measurements to new."
      });
    },
    
    clickConvert: function() {
      if (this.converting) {
        this.notificationText = "Saving conversion.";
        this.converting = false;
      } else {
        this.getConvertRecordStats();
        this.notificationText = "Starting conversion.";
        this.converting = true;
      }
    },
    
    cancelConversion: function() {
      this.notificationText = "Cancelled conversion.";
      this.converting = false;
    }
  },
  
  components: {
    datetime: Datetime.Datetime
  }
  
});