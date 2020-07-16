
let Papa       = require('papaparse');
let d3         = require('d3');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let Vue        = require('vue');

var vm = new Vue({
  el: '#uploadModal',

  data: {
    utcHours: alqwuutils.utcoffset,

    qualifiers: [],

    filePath: 'Select a File...',
    fileText: '',
    fileData: {
      meta: {
        fields: []
      }
    },
    metasFromSite:     [],
    uploadProgress:    0,


    singleMeasureData: {
      'metaid':  null,
      'offset':  null,
      'datestr': '',
      'measurements': [
        {
          'Value':                null,
          'CollectedDTM':         null,
          'MeasurementCommentID': null,
          'MeasurementQualityID': null,
          'QualifierID':          null,
          'Depth_M':              null
        }
      ]
    },

    singleMeasureExists: false,

    // Using negative numbers because metadata ids will always be >= zero.
    emptyID:     -1,
    datetimeID:  -2,
    qualifierID: -3,
    depthID:     -4,

    headerMetadataMap: {},
    headerNotices:     {},
    measurements:      [],

    papaConfig:     {
      quoteChar: '"',
      header: true,
      skipEmptyLines: true,
      fastMode: false,
      transformHeader: function(h) {
        return h.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_ -]/g, '');
      }
    }
  },

  computed: {

    utcoffset: function() {
      return Math.floor(this.utcHours*60)
    },

    utcHoursString: function() {
      return this.utcHours < 0 ? this.utcHours.toString() : "+" + this.utcHours.toString();
    },

    currentoffset: function() {
      return lx.DateTime.fromJSDate(new Date()).o;
    },

    utcstring: function() {
      return alqwuutils.utcOffsetString(this.utcoffset);
    },

    status: function() {
      let status = "selecting_file";
      if (typeof(this.fileData.data) === 'undefined') {
        status = "selecting_file";
      } else if (this.dtmColName === null || this.columnCount < 2) {
        status = "matching_headers";
      } else {
        status = "ready_to_upload";
      };
      return status;
    },

    headers: function() {
      return this.fileData.meta.fields;
    },

    headersWithMeta: function() {
      let headers = Object.keys(this.headerMetadataMap);
      let metas   = Object.values(this.headerMetadataMap);
      let headersFiltered = [];
      metas.forEach((m, i) => {
        if (m.metaid >= 0) {
          let h = {};
          let metaname = this.metas.filter((meta) => { return meta.MetadataID == m.metaid})[0].Parameter;

          h.name      = headers[i];
          h.metaName  = metaname;
          h.metaid    = metas[i].metaid;
          h.offset    = metas[i].offset;
          h.drift     = metas[i].drift;
          h.frequency = metas[i].frequency;
          h.decimals  = metas[i].decimals;
          h.nOverlap  = metas[i].nOverlap;
          h.notice    = metas[i].notice;

          let r = this.formatDataForUpload(
            h.name,
            h.offset,
            h.drift,
            h.frequency,
            h.decimals,
            h.metaid
          );

          h.measurements = r[0];
          h.cmis         = r[1];
          h.csum         = r[2];
          h.cmax         = r[3];
          h.cmin         = r[4];
          h.mindate      = r[5];
          h.maxdate      = r[6];
          // h.cmean = r[5];

          headersFiltered.push(h);
          
          Vue.nextTick(() => {
            this.graphColumn(h);
          });
          
        };
      });

      return headersFiltered;
    },

    metasFixed: function() {
      return [
        {
          MetadataID: this.emptyID,
          Parameter:  "Empty"
        },
        {
          MetadataID: this.datetimeID,
          Parameter:  "Date and Time"
        },
        {
          MetadataID: this.qualifierID,
          Parameter:  "Flag/qualifier"
        },
        {
          MetadataID: this.depthID,
          Parameter:  "Depth"
        },
      ]
    },

    metas: function() {
      return this.metasFixed.concat(this.metasFromSite);
    },

    columnCount: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      return metaIDs.filter(m => m.metaid != this.emptyID).length;
    },

    dtmColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m.metaid == this.datetimeID).length;
      let name    = null;

      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = metaIDs;
        let i = v.findIndex(m => m.metaid == this.datetimeID);
        name = k[i];
      }
      return name;
    },

    qualColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m.metaid == this.qualifierID).length;
      let name    = null;

      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = Object.values(this.headerMetadataMap);
        let i = v.findIndex(m => m.metaid == this.qualifierID);
        name = k[i];
      }
      return name;
      // return count;
    },

    depthColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m.metaid == this.depthID).length;
      let name    = null;

      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = Object.values(this.headerMetadataMap);
        let i = v.findIndex(m => m.metaid == this.depthID);
        name = k[i];
      }
      return name;
    },

    singleMeasureUploadBtnText: function() {
      return this.singleMeasureExists ? "Overwrite" : "Upload";
    }
  },

  methods: {
    openCSV() {
      this.setNotice('alert-primary', 'Uploading file now...');

      this.headerMetadataMap = {};

      let fileParsed = window.openCSV();
      this.filePath = fileParsed[0];
      this.fileText = fileParsed[1];
      $("#uploadFileName").text(this.filePath);

      // Even with the transform header function we may get some column names
      //   that are invalid selectors.  in theory we could search for the CSS
      //   valid selector regex -?[_a-zA-Z]+[_a-zA-Z0-9-]* and replace anything
      //   that doesn't match, but replace with what?

      this.fileData = Papa.parse(this.fileText, this.papaConfig);

      if (this.fileData.data.length > 0) {
        this.setNotice('alert-success', 'File upload complete!');

        var spID = $("#spSelect").val();

        if (spID != null) {

          this.getMetas(spID).done((metas) => {
            this.metasFromSite = metas;

            showColumnSelect();

            $("#uploadNextButton")
              .removeClass("d-none disabled")
              .off('click')
              .click(() => { reviewData(); });
          });
        } else {
          this.setNotice('alert-danger', 'There was a problem finding this sample point.');
        }
      } else {
        this.setNotice('alert-danger', 'Could not read the specified file.  Check the format and try again.');
      };
    },

    getMetas(spID) {
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataBySamplePt?spID=${spID}`,
        method:  'GET',
        timeout: 3000
      })
    },

    reviewHeadingSelection(event, header) {
      let metaID    = event.target.value;
      let frequency = null;
      let decimals  = null;
      if (metaID >= 0) {
        frequency = this.metasFromSite
          .filter(function(m) {return m.MetadataID == metaID})[0]
          .FrequencyMinutes;
        decimals = this.metasFromSite
          .filter(function(m) {return m.MetadataID == metaID})[0]
          .DecimalPoints;
      };
      
      let metaObj   = {
        "metaid":    metaID,
        "offset":    0,
        "drift":     0,
        "frequency": frequency,
        "decimals":  decimals,
        "nOverlap":  0,
        "notice":    ""
      };

      this.$set(this.headerMetadataMap, header, metaObj);
    },

    // Assumes data are supplied in chronological order, oldest to newest
    formatDataForUpload(header, offset, drift, frequency, decimals, metaid) {
      let data       = this.fileData.data;
      let returnData = [];

      let cmis  = 0;
      let csum  = 0;
      let cmax  = Number(data[0][header]);
      let cmin  = Number(data[0][header]);
      let mindate   = lx.DateTime.local(3000,01,01);
      let maxdate   = lx.DateTime.local(1000,01,01);
      // let cmean = Number(data[0][header]);

      let stepchange = 0;

      let firstdate = lx.DateTime
        .fromJSDate(new Date(data[0][this.dtmColName] + this.utcHoursString))
        .setZone(this.utcstring);
      let lastdate  = lx.DateTime
        .fromJSDate(new Date(data[data.length-1][this.dtmColName] + this.utcHoursString))
        .setZone(this.utcstring);

      if (frequency != null) {
        let differenceInMinutes = lastdate.diff(firstdate, 'minutes').as('minutes');
        let totalTimesteps      = (differenceInMinutes/frequency)+1;
        let missingTimesteps    = totalTimesteps - data.length;

        stepchange = drift/(totalTimesteps-1);
      };

      let n = 0;
      data.forEach((d, i, arr) => {
        let d2 = {};
        // Javascript interprets the date in the local time zone,
        //   which will probably have DST.
        d2.jsdate = lx.DateTime
          .fromJSDate(new Date(d[this.dtmColName] + this.utcHoursString))
          .setZone(this.utcstring);
        d2.CollectedDTM = d2.jsdate;

        d2.ValueOriginal        = d[header].trim() == ''   ? NaN  : Number(d[header]);
        d2.Depth_M              = this.depthColName == ''  ? null : d[this.depthColName];
        d2.QualifierID          = null;
        d2.MeasurementCommentID = null;
        d2.MeasurementQualityID = null;
        d2.MetadataID           = metaid;
        d2.CollectedDTMOffset   = this.utcoffset;

        d2.Value = this.roundToDecimal((d2.ValueOriginal + ((stepchange*n) + offset)), decimals);

        if (this.qualColName != '') {
          let qualifierobj = this.qualifiers.find(o => o.Code.trim() === d[this.qualColName]);
          d2.QualifierID = typeof qualifierobj == 'undefined' ? null : qualifierobj.QualifierID;
        };

        mindate = d2.CollectedDTM > mindate ? mindate : d2.CollectedDTM;
        maxdate = d2.CollectedDTM < maxdate ? maxdate : d2.CollectedDTM;

        let newVal = d2.Value;
        if (isNaN(newVal)) {
          cmis += 1;
        } else {
          csum += newVal;
          cmax = newVal > cmax ? newVal : cmax;
          cmin = newVal < cmin ? newVal : cmin;
        };

        // Now that we've calculated all the values, find determine if there's
        //   a gap between this entry and the last one entered.  If not,
        //   just push the new object; if so, set values to NaN and push.
        if (i === 0 || stepchange === 0) {
          returnData.push(d2);
          n += 1;
        } else {
          let lastPushedDate          = returnData[returnData.length-1].CollectedDTM;
          let currentDateLessInterval = d2.CollectedDTM.plus({minutes: frequency*-1});

          let diffMinutes = currentDateLessInterval.diff(lastPushedDate, 'minutes').as('minutes');
          let nToInsert   = diffMinutes/frequency;

          cmis += nToInsert;

          if (nToInsert <= 0) {
            returnData.push(d2);
            n += 1;
          } else {
            for (let j=1; j<=nToInsert; j++) {
              let d_copy = {...d2};

              d_copy.CollectedDTM  = lastPushedDate.plus({minutes: j*frequency});
              d_copy.ValueOriginal = NaN;
              d_copy.Value         = NaN;
              returnData.push(d_copy);
              n += 1;
            };
            d2.Value = this.roundToDecimal(d2.Value+(stepchange*nToInsert), decimals);
            returnData.push(d2);
            n += 1;
          };
        };
      });

      return [returnData, cmis, csum, cmin, cmax, mindate, maxdate];
    },

    changeOffsetOrDrift(header, frequency, decimals) {
      let offset = Number($("#offset" + header).val());
      let drift  = Number($("#drift"  + header).val());

      let headerMeta = this.headerMetadataMap[header];

      headerMeta.offset = offset;
      headerMeta.drift  = drift;

      this.$set(this.headerMetadataMap, header, headerMeta);
    },

    // Measurements needs be an object with 'dtm' and 'Value' arrays
    graphColumn(headerWithMeta) {
      let selector     = '#graph' + headerWithMeta.name;
      let measurements = headerWithMeta.measurements;
      
      $(selector).empty();
      let margin = {top: 10, right: 60, bottom: 30, left: 60},
          width = $("#uploadModal .modal-content").width() - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;
      // append the svg object to the body of the page
      let svg = d3.select(selector)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      //Read the data
      // Add X axis --> it is a date format
      let x = d3.scaleTime()
        .domain(d3.extent(measurements, function(d) { return new Date(d.CollectedDTM); }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
          .ticks(3));

      let valueExtent  = d3.extent(measurements, function(d) {return d.ValueOriginal; });
      let filledExtent = d3.extent(measurements, function(d) {return d.Value; });

      let yextent = [d3.min(valueExtent.concat(filledExtent)), d3.max(valueExtent.concat(filledExtent))]

      // Add Y axis
      let y = d3.scaleLinear()
        .domain(yextent)
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add the line for filled & adjusted data
      svg.append("path")
        .datum(measurements)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2.5)
        .attr("d", d3.line()
          .defined(d => !isNaN(d.Value))
          .x(function(d) { return x(new Date(d.CollectedDTM)) })
          .y(function(d) { return y(d.Value) })
          );

      // Add the line for original data
      svg.append("path")
        .datum(measurements)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .defined(d => !isNaN(d.ValueOriginal))
          .x(function(d) { return x(new Date(d.CollectedDTM)) })
          .y(function(d) { return y(d.ValueOriginal) })
          );
    },

    getMeasurementCount(headerWithMeta) {
      let data = {
        "metaid":    headerWithMeta.metaid,
        "startdtm":  headerWithMeta.mindate.toString(),
        "enddtm":    headerWithMeta.maxdate.toString(),
        "utcoffset": this.utcoffset
      };

      return $.ajax({
        url:         'http://localhost:3000/api/v1/getMeasurementCount',
        contentType: 'application/json',
        type:        'GET',
        data:        data,
        timeout:     3000
      });
    },

    deleteMeasurements(headerWithMeta) {
      let body = {
        'MetadataID': headerWithMeta.metaid,
        'MinDtm':     headerWithMeta.mindate,
        'MaxDtm':     headerWithMeta.maxdate
      };

      return $.ajax({
        type: 'DELETE',
        url: 'http://localhost:3000/api/v1/measurements',
        contentType: 'application/json',
        data: JSON.stringify(body),
        dataType: 'json',
        timeout: 3000
      });
    },

    uploadMeasurements(headerWithMeta) {
      let h             = headerWithMeta;
      let errors        = 0;
      let successes     = 0;
      let completeSteps = 0;
      let stepSize      = 30;    // The max number of rows to bulk insert.
      
      let calls         = [];

      let headerMeta = this.headerMetadataMap[h.name];

      for (let i=0; i<h.measurements.length; i+=stepSize) {
        let m = h.measurements.slice(i, i+stepSize)
        let dataToLoad = {'metaid': h.metaid,
                          'offset': this.utcoffset,
                          'loadnumber': i/stepSize,
                          'measurements': m};
        calls.push(
          $.ajax({
            type: 'POST',
            url:  'http://localhost:3000/api/v1/measurements',
            contentType: 'application/json',
            data: JSON.stringify(dataToLoad),
            dataType: 'json',
            timeout: 8000
          }).done((data) => {
            if (data != 'Success') {
              errors += m.length;
            } else {
              successes += m.length;
            }
          }).fail((err) => {
            errors += m.length;
          }).always(() => {

            if (errors > 0) {
              // let msg = "Loading in progress.  Encountered errors with " +
                // errors + " records out of " +
                // (errors + successes) + "so far.";
              // headerMeta.notice = msg;
            } else {
              
              // Change this to a progress bar
              
              this.uploadProgress = Math.floor(((successes + errors) / h.measurements.length) * 100);
              
              // let msg = "Loading in progress.  Successfully loaded " +
                // successes + " records so far.";
              // headerMeta.notice = msg;
              
              // Refactor the notice so we don't have to recalculate 
              //   the entire metadata record on every update
              
              // this.setNotice('alert-info', msg);
            };
          })
        );
      };

      Promise.all(calls)
      .then((result) => {
        if (errors > 0) {
          let msg = "Loading complete.  Encountered errors with " +
            errors + " records out of " +
            (errors + successes);
          headerMeta.notice = msg;
          // this.setNotice('alert-danger', msg);
        } else {
          let msg = "Loading complete.  Successfully loaded " +
            successes + " records.";
          headerMeta.notice = msg;
          // this.setNotice('alert-success', msg);
        };
        if (successes > 0) {
          this.setWorkup(headerWithMeta);
        };
      })
    },

    setWorkup(headerWithMeta) {
      let dataToLoad = {
        FileName:   this.filePath,
        MetadataID: headerWithMeta.metaid,
        UserID:     window.getConfig().userid,
        offset:     this.utcoffset,
        DataStarts: headerWithMeta.mindate,
        DataEnds:  headerWithMeta.maxdate
      };
      $.ajax({
        type:        'POST',
        url:         'http://localhost:3000/api/v1/workup',
        contentType: 'application/json',
        data:        JSON.stringify(dataToLoad),
        dataType:    'json',
        timeout:     3000
      }).done((data) => {
      }).fail((err) => {
        console.log("Workup load failed; " + err);
      });
    },

    clickUpload(headerWithMeta) {
      let headerMeta = this.headerMetadataMap[headerWithMeta.name];
      let nOverlap   = headerMeta.nOverlap;


      if (nOverlap == 0) {
        this.getMeasurementCount(headerWithMeta)
          .then((data) => {

            headerMeta.nOverlap = data.measurementCount;
            this.$set(this.headerMetadataMap, headerWithMeta.name, headerMeta);

            if (data.measurementCount == 0) {
              this.uploadMeasurements(headerWithMeta);
              headerMeta.notice = "Loading measurements..."
            } else {
              headerMeta.notice = 'Found ' + data.measurementCount + ' existing measurements.  Delete?'
            };
          });
      } else {
        this.deleteMeasurements(headerWithMeta)
          .then(() => {
            headerMeta.notice = 'Deleted ' + nOverlap + ' measurements.'
            headerMeta.nOverlap = 0;
            this.$set(this.headerMetadataMap, headerWithMeta.name, headerMeta);
          });
      };
    },

    getQualifiers() {
      $.ajax({
        type:        'GET',
        url:         'http://localhost:3000/api/v1/qualifierList',
        contentType: 'application/json',
        dataType:    'json',
        timeout:     3000
      }).done((data) => {
        let firstQualifier = {Code: "", QualifierID: null};
        let q = [firstQualifier].concat(data);
        this.qualifiers = q;
      }).fail((err) => {
        console.log(err);
      }).always(() => {
      });
    },

    showSingleMeasurement() {
      let spID = $("#spSelect").val();
      if (spID != null) {

        this.getMetas(spID).done((metas) => {
          this.metasFromSite = metas;
        });

        this.filePath = "Single Measurement"

        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadCSVContainer").addClass("d-none");
        $("#uploadReviewContainer").addClass("d-none");
        $("#addSingleMeasurement").removeClass("d-none");

        $("#uploadBackButton")
          .removeClass("d-none")
          .off("click")
          .click(() => { showUpload(); });

        $("#uploadNextButton")
          .addClass("d-none");

        vm.setNotice('alert-info', 'Fill in details to load a single measurement.');

      } else {
        this.setNotice('alert-danger', 'There was a problem finding this sample point.');
      };
    },

    clickUploadSingleMeasure() {
      let workupPayload = {
        'metaid':  this.singleMeasureData.metaid,
        'mindate': this.singleMeasureData.measurements[0].CollectedDTM,
        'maxdate': this.singleMeasureData.measurements[0].CollectedDTM
      };
      if (this.singleMeasureExists) {
        let deletePayload = {
          'metaid':  this.singleMeasureData.metaid,
          'mindate': this.singleMeasureData.measurements[0].CollectedDTM,
          'maxdate': this.singleMeasureData.measurements[0].CollectedDTM
        };
        this.deleteMeasurements(deletePayload)
        .done((data) => {
          this.setSingleMeasure()
          .done((data) => {
            this.setNotice('alert-success', 'Successfully uploaded a single measurement.');
            this.singleMeasureExists = false;
            this.setWorkup(workupPayload);
          })
          .fail((err) => {
            this.setNotice('alert-warning', 'Deleted existing measurement, but could not add the new one.');
          })
        })
        .fail((err) => {
          this.setNotice('alert-warning', 'Could not delete existing measurement.');
        })
      } else {
        this.setSingleMeasure()
        .done((data) => {
          this.setNotice('alert-success', 'Successfully uploaded a single measurement.');
          this.singleMeasureExists = false;
          this.setWorkup(workupPayload);
        })
        .fail((err)=> {
          if (err.status == 409) {
            this.setNotice('alert-warning', 'This measurement already exists in the database.  Overwrite?');
            this.singleMeasureExists = true;
          } else {
            this.setNotice('alert-danger', 'Upload failed.  Server message: ' + err.responseText);
          };
        });
      };
    },
    
    setSingleMeasure() {
      let ajaxData = JSON.stringify(this.singleMeasureData);
      return $.ajax({
        url:      'http://localhost:3000/api/v1/measurements',
        contentType: 'application/json',
        method:   'POST',
        timeout:  3000,
        dataType: 'json',
        data:     ajaxData
      });
    },
    
    singleMeasureDTMChange() {
      let dtString = this.singleMeasureData.datestr;
      this.singleMeasureData.offset = this.utcoffset;

      this.singleMeasureData.measurements[0].CollectedDTM = lx.DateTime
          .fromJSDate(new Date(dtString + this.utcHoursString))
          .setZone(this.utcstring);
      this.singleMeasureExists = false;
    },
    
    reset() {
      $("#uploadColumnSelectContainer select").val(-1).change();
      
      this.filePath                = '';
      this.fileText                = '';
      this.headerMetadataMap       = {};

      delete this.fileData.data;
    },

    setNotice(cls, msg) {
      $("#uploadAlert")
        .removeClass("alert-success alert-danger alert-primary alert-info alert-warning")
        .addClass(cls)
        .text(msg);
    },

    roundToDecimal(number, decimal) {
      return Math.round(number*Math.pow(10, decimal))/Math.pow(10, decimal);
    }
  }
});

// Generic functions

// From column selection back to CSV upload
var showUpload = function() {
    $("#uploadCSVContainer").removeClass("d-none");
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");
    $("#uploadFileName").text("Select a File...");

    $("#uploadBackButton")
      .addClass("d-none")
      .off("click");

    $("#uploadNextButton")
      .removeClass("d-none")
      .addClass("disabled")
      .off("click");

    vm.setNotice('alert-info', 'Select a file...');
};

var showColumnSelect = function() {
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadColumnSelectContainer").removeClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");
    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });

    vm.setNotice('alert-info', 'Match the CSV headers with the correct metadata.');
};

// From column selection to data review
var showReview = function() {
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadReviewContainer").removeClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");

    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });

    $("#uploadNextButton")
      .addClass("d-none");

    vm.setNotice('alert-info', 'Review uploaded data for accuracy.');
};

$(document).ready(function() {
    vm.getQualifiers();
    $("#siteSelect").change(function() {
      $("#uploadCSVContainer").removeClass("d-none");
      $("#uploadColumnSelectContainer").addClass("d-none");
      $("#uploadReviewContainer").addClass("d-none");
      $("#uploadBackButton").addClass("d-none");
      $("#uploadNextButton").addClass("d-none");
    });

    $("#openCSVFileButton").click(() => {
      vm.openCSV();
    });
});

var reviewData = function() {

  showReview();

  $('#uploadReviewTab a:first').tab('show')

};


