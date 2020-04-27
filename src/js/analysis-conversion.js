
let Vue      = require('vue');
let Datetime = require('vue-datetime');
let dt       = require('luxon');
let d3       = require('d3');
let utils    = require('./utils.js');

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
    utcoffset: utils.utcoffset,
    
    conversions: [],
    drs: [],
    measurements: [],
    
    nulls: 0,
    valids: 0,
    recordsToOverwrite: 0,
    
    converting: false,
    conversionState: 'initial',
    error: false,
    notificationText: `Select a data record to calculate 
      from, one to save new data to, a conversion table, and a timeframe.`,
    
    // D3 stuff.
    oldLine: '',
    newLine: '',
    svgWidth: 500,
    margin: {
      top: 10, 
      right: 30, 
      bottom: 30, 
      left: 40
    },
  },
  
  mounted: function () {
    this.loadDRs();
    this.loadConversions();
    this.addResizeListener();
  },
  
  watch: {
    measurements: function() {
      this.setSVGWidth();
      this.calculatePathOldVals();
      this.calculatePathNewVals();
    }
  },
  
  computed: {
    convertButtonText: function() {
      return this.converting ? "Save" : "Start";
    },
    
    convertButtonDisable: function() {
      let st = this.conversionState;
      return st == 'loading';
    },
    
    utcFromDate: function() {
      return dt.DateTime
        .fromISO(this.fromDate, { zone: this.utcZoneString })
        // .setZone('utc');
    },
    
    utcToDate: function() {
      return dt.DateTime
        .fromISO(this.toDate, { zone: this.utcZoneString })
        // .setZone('utc');
    },
    
    utcZoneString: function() {
      let hours = Math.abs(this.utcoffset);
      let sign  = this.utcoffset < 0 ? '+' : '-';
      return('UTC' + sign + hours);
    },
    
    svgHeight: function() {
      return Math.floor(this.svgWidth / 2.2);
    },
    
    outsideWidth() {
      return this.svgWidth + this.margin.left + this.margin.right;
    },
    
    outsideHeight() {
      return this.svgHeight + this.margin.top + this.margin.bottom;
    },
    
    scale() {
      const x = d3
        .scaleTime()
        .domain(d3.extent(this.measurements, d => d.jsdate))
        .rangeRound([0, this.svgWidth]);
      
      let extent    = d3.extent(this.measurements, d => d.Value);
      let extentOld = d3.extent(this.measurements, d => d.FromValue);
      extent[0] = extentOld[0] < extent[0] ? extentOld[0] : extent[0];
      extent[1] = extentOld[1] > extent[1] ? extentOld[1] : extent[1];
      
      const y = d3
        .scaleLinear()
        .domain(extent)
        .rangeRound([this.svgHeight, 0]);
      return { x, y };
    },
  },
  
  directives: {
    axis(el, binding) {
      const axis = binding.arg;
      const axisMethod = { x: "axisBottom", y: "axisLeft" }[axis];
      const methodArg = binding.value[axis];
      
      d3.select(el).call(d3[axisMethod](methodArg).ticks(4));
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
        'MetadataID':   this.oldDRID,
        'FromDate':     this.fromDate,
        'ToDate':       this.toDate
      }
      $.ajax({
        url: `http://localhost:3000/api/v1/conversionStats`,
        data: query,
        method:'GET',
        timeout: 10000
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
        data.forEach((d) => {
          d.jsdate = new Date(d.CollectedDTM);
        });
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
    },
    
    // D3 methods
    
    calculatePathOldVals() {
      const scale = this.scale;
      const path = d3.line()
        .x(d => scale.x(d.jsdate))
        .y(d => scale.y(d.FromValue));
      this.oldLine = path(this.measurements);
    },
    
    calculatePathNewVals() {
      const scale = this.scale;
      const path = d3.line()
        .x(d => scale.x(d.jsdate))
        .y(d => scale.y(d.Value));
      this.newLine = path(this.measurements);
    },
    
    setSVGWidth() {
      if ($("#conversionChartContainer").width() > 0) {
        this.svgWidth = $("#conversionChartContainer").width() - this.margin.left - this.margin.right;
      } else {
        this.svgWidth = 500;
      };
    },
    
    addResizeListener() {
      window.addEventListener('resize', () => {
        this.setSVGWidth();
        this.calculatePathOldVals();
        this.calculatePathNewVals();
      });
    },
  },
  
  components: {
    datetime: Datetime.Datetime
  }
  
});