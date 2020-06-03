
let Vue      = require('vue');
let Datetime = require('vue-datetime');
let lx       = require('luxon');
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
    
    fromDate: '',
    toDate: '',
    utcoffset: Math.floor(utils.utcoffset*60),
    
    conversions: [],
    drs: [],
    measurements: [],
    
    nulls: 0,
    valids: 0,
    recordsToOverwrite: 0,
    
    converting: false,
    // initial -> loading -> calculated -> loaded
    conversionState: 'initial',
    error: false,
    loadErrorCount: 0,
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
      return this.conversionState == 'calculated' ? 'Save' : 'Start';
    },
    
    convertButtonDisable: function() {
      let disable = false;
      if (this.conversionState == 'loading') {
        disable = true;
      } else if (this.fromDate.length == 0 | this.toDate.length == 0) {
        disable = true;
      }
      return disable;
    },
    
    formDisable: function() {
      return this.conversionState == 'calculated';
    },
    
    utcZoneString: function() {
      return utils.utcOffsetString(this.utcoffset)
    },
    
    minMeasurementDate: function() {
      let min = this.measurements.reduce((prev, curr) => prev.jsdate < curr.jsdate ? prev : curr);
      return min.jsdate;
    },
    
    maxMeasurementDate: function() {
      let max = this.measurements.reduce((prev, curr) => prev.jsdate > curr.jsdate ? prev : curr);
      return max.jsdate;
    },
    
    narrativeClass: function() {
      let nclass = 'alert-info';
      if (this.error) {
        nclass = 'alert-danger';
      } else if(this.nulls > 0 | this.recordsToOverwrite > 0) {
        nclass = 'alert-warning';
      };
      return nclass;
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
          this.notificationText = `Stats calculated; running conversion...`;
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
          let utcZS = utils.utcOffsetString(d.CollectedDTMOffset);
          d.jsdate = lx.DateTime
            .fromISO(d.CollectedDTM)
            // Because the API assumes that dates in the database
            //   are in UTC, we have to change the CollectedDTM back
            //   to the correct local time.
            .minus({minutes: this.utcoffset})
            .setZone(this.utcZoneString)  // Not strictly necessary, but handy
          d.CollectedDTM = d.jsdate;
          d.DateString = d.CollectedDTM.toString();
          // d.CollectedDTM = lx.DateTime
            // .fromJSDate(d.jsdate)
            // .setZone(utcZS, { keepLocalTime: true });
        });
        this.measurements = data;
        this.conversionState = 'calculated';
        this.getExistingMeasurements();
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.conversionState = 'initial';
        this.notificationText = "Error attempting to convert old measurements to new."
      });
    },
    
    getExistingMeasurements: function() {
      this.conversionState = 'loading';
      let query = {
        'metaid':   this.newDRID,
        'startdtm': this.minMeasurementDate.toString(),
        'enddtm':   this.maxMeasurementDate.toString()
      };
      $.ajax({
        url: `http://localhost:3000/api/v1/getMeasurementCount`,
        data: query,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.recordsToOverwrite = data.measurementCount;
        this.conversionState = 'calculated';
        this.notificationText = `
          ${this.valids} valid measurements to convert; 
          ${this.nulls} non-matching records; and
          ${this.recordsToOverwrite} records to write over (delete and replace).`;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.conversionState = 'initial';
        this.notificationText = "Error finding number of existing measurements to overwrite."
      });
    },
    
    deleteExistingMeasurements: function() {
      this.notificationText = `Deleting ${this.recordsToOverwrite} measurements...`;
      let query = {
        'MetadataID': this.newDRID,
        'MinDtm':     this.fromDate,
        'MaxDtm':     this.toDate
      };
      $.ajax({
        url: `http://localhost:3000/api/v1/measurements`,
        contentType: 'application/json',
        data: JSON.stringify(query),
        method:'DELETE',
        timeout: 3000
      }).done((data) => {
        this.uploadCalculatedMeasurements();
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.conversionState = 'initial';
        this.notificationText = "Error overwriting existing measurements."
      });
    },
    
    uploadCalculatedMeasurements: function() {
      this.notificationText = `Uploading ${this.measurements.length} measurements...`;
      this.conversionState = 'loading';
      let errors        = 0;
      let successes     = 0;
      let stepSize      = 30;    // The max number of rows to bulk insert.
      for (let i=0; i<this.measurements.length; i+=stepSize) {
        let dataToLoad = {'metaid': this.newDRID,
                          'offset': this.utcoffset,
                          'loadnumber': i/stepSize,
                          'measurements': this.measurements.slice(i, i+stepSize)};
        //console.log("Starting Post #" + i/stepSize);
        
        $.ajax({
          type: 'POST',
          url: 'http://localhost:3000/api/v1/measurements',
          contentType: 'application/json',
          data: JSON.stringify(dataToLoad),
          dataType: 'json',
          timeout: 5000
        }).done((data) => {
          console.log("Server says: " + data);
          if (data != 'Success') {
            errors += dataToLoad.measurements.length;
          } else {
            successes += dataToLoad.measurements.length;
          }
          //console.log("Loaded Post #" + i/stepSize);
        }).fail((err) => {
          console.log("Upload failed for Post #" + i/stepSize);
          errors += dataToLoad.measurements.length;
        }).always(() => {
          this.notificationText = (`
            ${errors} errors and 
            ${successes} successes so far of 
            ${this.measurements.length} values to load...`);
          this.error = errors > 0 ? true : false;
          if (errors + successes == this.measurements.length) {
            this.conversionState = 'initial';
            this.notificationText = `Loaded ${successes} measurements; failed to load ${errors}.`;
            
            this.setWorkup()
            .always((data) => {
              this.measurements = [];
              this.newLine = '';
              this.oldLine = '';
              
              this.valids = 0;
              this.nulls = 0;
              this.recordsToOverwrite = 0;
              this.loadErrorCount = 0;
            });
            
          };
        }); 
      };
    },
    
    setWorkup(headerWithMeta) {
      let dataToLoad = {
        FileName:   "Calculated",
        MetadataID: this.newDRID,
        UserID:     window.getConfig().userid,
        offset:     this.utcoffset,
        DataStarts: this.minMeasurementDate,
        DataEnds:   this.maxMeasurementDate
      };
      return $.ajax({
        type:        'POST',
        url:         'http://localhost:3000/api/v1/workup',
        contentType: 'application/json',
        data:        JSON.stringify(dataToLoad),
        dataType:    'json',
        timeout:     3000
      });
    },
    
    clickConvert: function() {
      if (this.conversionState == 'initial') {
        this.notificationText = "Starting conversion.";
        this.converting = true;
        this.getConvertRecordStats();
      } else if(this.recordsToOverwrite > 0) {
        this.converting = false;
        this.deleteExistingMeasurements();
      } else {
        this.uploadCalculatedMeasurements();
      }
    },
    
    cancelConversion: function() {
      this.notificationText = "Cancelled conversion.";
      this.converting = false;
      this.conversionState = 'initial';
      
      this.measurements = [];
      this.newLine = '';
      this.oldLine = '';
      
      this.valids = 0;
      this.nulls = 0;
      this.recordsToOverwrite = 0;
      this.loadErrorCount = 0;
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