
let Vue      = require('vue');
let Datetime = require('vue-datetime');
let lx       = require('luxon');
let d3       = require('d3');
let utils    = require('./utils.js');
let _        = require('lodash');

let $          = require('jquery');
let bootstrap  = require('bootstrap');

import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

var vm = new Vue({
  el: '#v-pills-conversion',
  
  components: {
    'v-select': vSelect,
    datetime:   Datetime.Datetime
  },
  
  data: {
    oldDR: {
      spid:               null,
      paramAndMethod:     {},
      paramAndMethodList: [],
      drid:               null,
      drlist:             []
    },
    
    newDR: {
      MeasurementCount: null,
      MinDate: null,
      MaxDate: null,
      MetadataID: null,
      ParameterID: null,
      UnitID: null,
      SamplePointID: null,
      Notes: null,
      MethodID: null,
      Active: null,
      FrequencyMinutes: null,
      DecimalPoints: null,
      FileName: null,
      DataStarts: null,
      DataEnds: null,
      UserID: null,
      CreatedOn: null,
      EquipmentIDSensor: null,
      EquipmentIDLogger: null,
    },
    
    samplePointList: [],
    ConversionID:    null,
    
    fromDate:  '',
    toDate:    '',
    utcoffset: Math.floor(utils.utcoffset*60),
    
    offset: 0,
    drift:  0,
    
    conversions:  [],
    measurements: [],
    parameters:   [],
    methods:      [],
    units:        [],
    dboptions:    [],
    
    conflictingMetas: [],
    
    minMeasurementDate: lx.DateTime.fromISO('3000-01-01'),
    maxMeasurementDate: lx.DateTime.fromISO('1000-01-01'),
    
    nulls:  0,
    valids: 0,
    recordsToOverwrite: 0,
    
    disableSave: true,
    
    error: false,
    loadErrorCount: 0,
    notificationText: `Select source and destination data records, and a conversion table.`,
    
    // D3 stuff.
    oldLine: '',
    newLine: '',
    svgWidth: 500,
    margin: {
      top: 10, 
      right: 30, 
      bottom: 30, 
      left: 60
    },
    
    pane: 'dr',
  },
  
  mounted: function () {
    this.loadSamplePoints();
    this.loadConversions();
    this.loadMethods();
    this.loadParameters();
    this.loadUnits();
    this.loadOptions();
    this.addResizeListener();
  },
  
  watch: {
    
    offset: function(val) {
      if (!isNaN(+val) && isFinite(val) && val !== '') { 
        this.disableSave = true;
        this.notificationText = "Working on it...";
        this.getConvertRecordStats();
      };
    },
    
    drift: function(val) {
      if (!isNaN(+val && isFinite(val) && val !== '')) { 
        this.disableSave = true;
        this.notificationText = "Working on it...";
        this.getConvertRecordStats();
      };
    },
    
    measurements: function() {
      this.setSVGWidth();
      this.calculatePathOldVals();
      this.calculatePathNewVals();
    },
    
    oldDRspid: function(val) {
      this.oldDR.paramAndMethodList = [];
      this.oldDR.paramAndMethod     = {};
      
      this.oldDR.drlist = [];
      this.oldDR.drid   = null;
      
      this.loadParamsAndMethods(val)
        .done((data) => {
          this.oldDR.paramAndMethodList = data;
        });
    },
    
    oldParamAndMethod: function(val) {
      this.oldDR.drlist = [];
      this.oldDR.drid   = null;
      
      this.loadMetas(this.oldDR)
        .done((data) => {
          data.forEach((d) => {
            let mindt = new Date(d.mindt).toLocaleString();
            let maxdt = new Date(d.maxdt).toLocaleString();
            d.name = d.FileName + "; " + mindt + " to " + maxdt;
          });
          this.oldDR.drlist = data;
        });
    },
    
    oldDRID: function(val) {
      
      if (val != null) {
        this.loadDR(val)
          .done((data) => {
            this.newDR = data[0];
          });
      };
    },
  },
  
  computed: {
    
    disableNextButton: function() { 
      let status = true;
      if (this.pane === 'dr' && this.oldDR.drid != null) {
        status = false;
      } else if (this.pane === 'newdr' && 
        this.ConversionID != null && 
        this.newDR.ParameterID != null && 
        this.newDR.MethodID != null) {
        status = false;
      };
      return status;
    },
    
    oldDRspid:         function() { return this.oldDR.spid },
    oldParamAndMethod: function() { return this.oldDR.paramAndMethod },
    oldDRID:           function() { return this.oldDR.drid },
    
  newParamAndMethod: function() {
    let str = '';
    if (this.newDR.ParameterID != null && this.newDR.MethodID != null) {
      let param  = _.find(this.parameters, ['ParameterID', this.newDR.ParameterID]).Name;
      let method = _.find(this.methods,    ['MethodID',    this.newDR.MethodID]).Name;
      str = param + " (" + method + ")";
    }
    return str;
  },
    
    stepChangePerMinute: function() {
      if (this.drift == 0) {
        return 0;
      } else {
        let luxonFromDate = this.measurements[0].CollectedDTM;
        let luxonToDate   = this.measurements[this.measurements.length-1].CollectedDTM;
        let m = lx
          .Interval
          .fromDateTimes(luxonFromDate, luxonToDate)
          .length('minutes');
        // return i.length('minutes');
        return this.drift/m;
      };
    },
    
    convertButtonText: function() {
      return this.recordsToOverwrite > 0 ? 'Delete' : 'Save';
    },
    
    utcZoneString: function() {
      return utils.utcOffsetString(this.utcoffset)
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
    
    // D3 computed elements for the graph
    svgHeight: function() {
      return Math.floor(this.svgWidth / 5);
    },
    
    outsideWidth() {
      return this.svgWidth + this.margin.left + this.margin.right;
    },
    
    outsideHeight() {
      return this.svgHeight + this.margin.top + this.margin.bottom;
    },
    
    scaleNew() {
      const x = d3
        .scaleTime()
        .domain(d3.extent(this.measurements, d => d.jsdate))
        .rangeRound([0, this.svgWidth]);
      
      let extent    = d3.extent(this.measurements, d => d.Value);
      
      const y = d3
        .scaleLinear()
        .domain(extent)
        .rangeRound([this.svgHeight, 0]);
      return { x, y };
    },
    
    scaleOld() {
      const x = d3
        .scaleTime()
        .domain(d3.extent(this.measurements, d => d.jsdate))
        .rangeRound([0, this.svgWidth]);
      
      let extent = d3.extent(this.measurements, d => d.OriginalValue);
      
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
    loadSamplePoints: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/samplePointList?active=1`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.samplePointList = data;
      }).fail((err) => {
        console.log(err);
      });
    },
    
    loadParamsAndMethods: function(spID) {
      let request = {
        spID: spID
      };
      return $.ajax({
        url:     `http://localhost:3000/api/v1/getUniqueParamAndMethod`,
        method:  'GET',
        timeout: 3000,
        data:    request
      })
    },
    
    loadMetas: function(dr) {
      let request = {
        spID:        dr.spid,
        ParameterID: dr.paramAndMethod.ParameterID,
        MethodID:    dr.paramAndMethod.MethodID
      };
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataBySPParamMethodDate`,
        method:  'GET',
        timeout: 3000,
        data:    request
      })
    },
    
    loadDR: function(drid) {
      let request = {
        metadataid: drid,
        utcoffset: this.utcoffset/60
      };
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataDetails`,
        method:  'GET',
        timeout: 3000,
        data:    request
      })
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
    
    loadParameters: function() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/parameterList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.parameters = data;
      }).fail((err) => {
        console.log(err);
      });
    },
    
    loadMethods: function() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/methodList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.methods = data;
      }).fail((err) => {
        console.log(err);
      });
    },
    
    loadUnits: function() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/unitList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.units = data;
      }).fail((err) => {
        console.log(err);
      });
    },
    
    
    loadOptions: function() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/dboptionList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.dboptions = data;
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getConvertRecordStats: _.debounce(function() {
      let query = {
        'ConversionID': this.ConversionID,
        'MetadataID':   this.oldDRID
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
          this.notificationText = 'No records found matching that date range and conversion table.'
        }
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Failed to retrieve stats for this data record."
      });
    }, 400),
    
    getConvertedMeasurements: function() {
      let query = {
        'MetadataID':   this.oldDRID,
        'ConversionID': this.ConversionID,
        'FromDate':     this.fromDate,
        'ToDate':       this.toDate,
        'Offset':       this.offset,
        'StepChange':   this.stepChangePerMinute
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
          
          if (d.CollectedDTM < this.minMeasurementDate) {
            this.minMeasurementDate = d.CollectedDTM;
          } else if (d.CollectedDTM > this.maxMeasurementDate) {
            this.maxMeasurementDate = d.CollectedDTM;
          };
          
        });
        this.measurements = data;
        this.getExistingMetadatas();
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Error attempting to convert old measurements to new."
      });
    },
    
    getExistingMetadatas: function() {
      let query = {
        spID:        this.newDR.SamplePointID,
        ParameterID: this.newDR.ParameterID,
        MethodID:    this.newDR.MethodID,
        MinDate:     this.minMeasurementDate.toISO(),
        MaxDate:     this.maxMeasurementDate.toISO()
      };
      $.ajax({
        url: `http://localhost:3000/api/v1/metadataBySPParamMethodDate`,
        data: query,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        
        this.conflictingMetas = data;
        
        let rto = 0;
        data.forEach((d) => {
          rto += +d.nmeasures;
        });
        
        this.recordsToOverwrite = rto;
        this.notificationText = `
          ${this.valids} valid measurements to convert; 
          ${this.nulls} non-matching records; and
          ${this.recordsToOverwrite} records to write over (delete and replace).`;
          
        this.disableSave = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Error finding number of existing measurements to overwrite."
      });
    },
    
    deleteExistingMeasurements: function() {
      this.notificationText = `Deleting ${this.recordsToOverwrite} measurements...`;
      
      // This assumes that there is only one conflicting metadata, ever.
      //   99% of the time this will be true.  It is possible that sometimes
      //   it will not be true.  In those cases we'll have to update this logic
      //   to use an object with multiple ajax calls, like for loading measurements.
      
      let metaid = this.conflictingMetas[0].MetadataID;
      
      let deleteMeasures = $.ajax({
        url: `http://localhost:3000/api/v1/measurements?` + $.param({MetadataID: metaid }),
        contentType: 'application/json',
        method:'DELETE',
        timeout: 3000
      })
      
      let deleteMetadata = deleteMeasures.then((data) => {
        return $.ajax({
          url: `http://localhost:3000/api/v1/metadata?` + $.param({MetadataID: metaid }),
          contentType: 'application/json',
          method:'DELETE',
          timeout: 3000
        })
      });
      
      deleteMetadata.done((data) => {
        this.notificationText = `Deleted ${this.recordsToOverwrite} measurements.`;
        this.getConvertRecordStats();
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Error deleting existing measurements."
      }).always(() => {
        $("#deleteModal").modal('hide');
      });
      
    },
    
    uploadCalculatedMeasurements: function() {
      
      let utcoffset = this.measurements[0].CollectedDTMOffset;
      
      // Fill in all the metadata info that is specific to this file & not automatic
      this.newDR.FileName      = "Derived from " + this.newDR.FileName;
      this.newDR.UserID        = window.getConfig().userid;
      // this.newDR.UTCOffset     = utcoffset;
      
      $.ajax({
        url:         `http://localhost:3000/api/v1/metadata`,
        data:        JSON.stringify(this.newDR),
        contentType: 'application/json',
        method:      'POST',
        timeout:     3000
      }).done((metadataID) => {
        
        // Once we have the ID of the new metadata, we load the data
        //   to the database in chunks of 30 at a time.  This keeps us
        //   from overloading the call and timing out, and allows us
        //   to provide feedback to the user about how much data has been 
        //   loaded during the upload.
        
        let calls             = [];
        
        this.notificationText = `Uploading ${this.measurements.length} measurements...`;
        let errors            = 0;
        let successes         = 0;
        let stepSize          = 30;    // The max number of rows to bulk insert.
        
        for (let i=0; i<this.measurements.length; i+=stepSize) {
          let dataToLoad = {'metaid': metadataID,
                            'offset': utcoffset,
                            'loadnumber': i/stepSize,
                            'measurements': this.measurements.slice(i, i+stepSize)};
          
          calls.push(
            $.ajax({
              type: 'POST',
              url: 'http://localhost:3000/api/v1/measurements',
              contentType: 'application/json',
              data: JSON.stringify(dataToLoad),
              dataType: 'json',
              timeout: 5000
            }).done((data) => {
              if (data != 'Success') {
                errors += dataToLoad.measurements.length;
              } else {
                successes += dataToLoad.measurements.length;
              }
            }).fail((err) => {
              console.log("Upload failed for Post #" + i/stepSize);
              console.log(err);
              errors += dataToLoad.measurements.length;
            }).always(() => {
              
              this.notificationText = (`
                ${errors} errors and 
                ${successes} successes so far of 
                ${this.measurements.length} values to load...`);
                
              this.error = errors > 0 ? true : false;
              
              if (errors + successes == this.measurements.length) {
                let nprocessed = errors + successes;
                this.notificationText = `Processed ${nprocessed}; ${errors} errors and ${successes} successes.`;
              };
              
            })
          );
        };
        
        Promise.all(calls)
        .then((result) => {
          let msg = "Done!";
          if (errors > 0) {
            msg = "Loading complete.  Encountered errors with " +
              errors + " records out of " +
              (errors + successes);
          } else {
            msg = "Loading complete.  Successfully loaded " +
              successes + " records.";
          };
          this.notificationText = msg;
        });
      });
    },
    
    clickConvert: function() {
      if (this.recordsToOverwrite > 0) {
        this.notificationText = "Deleting measurements...";
        $("#deleteModal").modal("show");
      } else {
        this.uploadCalculatedMeasurements();
      }
    },
    
    setStageDischargeDefaults() {
      let sdParamID  = _.find(this.dboptions, ['Name', 'Discharge_ParameterID']).ValueInt;
      let sdMethodID = _.find(this.dboptions, ['Name', 'Discharge_MethodID']).ValueInt;
      let sdUnitID   = _.find(this.dboptions, ['Name', 'CFS_UnitID']).ValueInt;
      
      console.log("sdParamID" + sdParamID);
      console.log("sdMethodID" + sdMethodID);
      console.log("sdUnitID" + sdUnitID);
      
      if (typeof _.find(this.parameters, ['ParameterID', sdParamID]) !== 'undefined') {
        this.newDR.ParameterID = sdParamID;
      };
      if (typeof _.find(this.methods, ['MethodID', sdMethodID]) !== 'undefined') {
        this.newDR.MethodID = sdMethodID;
      };
      if (typeof _.find(this.units, ['UnitID', sdUnitID]) !== 'undefined') {
        this.newDR.UnitID = sdUnitID;
      };
      
    },
    
    // Navigation methods
    nextScreen() {
      if (this.pane === 'dr') {
        try { 
          this.setStageDischargeDefaults();
        } catch (error) {
          console.log(error);
        } finally {
          this.pane = 'newdr';
        };
      } else if (this.pane === 'newdr') {
        this.disableSave = true;
        this.pane = 'graph';
        this.getConvertRecordStats();
      }
    },
    
    lastScreen() {
      if (this.pane === 'newdr') {
        this.pane = 'dr';
      } else if (this.pane === 'graph') {
        this.pane = 'newdr';
      }
    },
    
    // D3 methods
    
    calculatePathOldVals() {
      const scale = this.scaleOld;
      const path = d3.line()
        .x(d => scale.x(d.jsdate))
        .y(d => scale.y(d.OriginalValue));
      this.oldLine = path(this.measurements);
    },
    
    calculatePathNewVals() {
      const scale = this.scaleNew;
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
  
});