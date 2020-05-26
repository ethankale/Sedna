
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
    
    // Using negative numbers because metadata ids will always be >= zero.
    emptyID:     -1,
    datetimeID:  -2,
    qualifierID: -3,
    depthID:     -4,
    
    headerMetadataMap: {},
    measurements:      [],
    
    nOverlappingMeasurements: 0,
    
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
      } else if (this.nOverlappingMeasurments > 0) {
        status = "ready_to_delete";
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
          this.graphColumn(h);
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
    
    uploadButtonText: function() {
      return this.nOverlappingMeasurements > 0 ? "Delete" : "Upload";
    }
  },
  
  methods: {
    openCSV() {
      $("#uploadAlert")
        .removeClass("alert-danger alert-info alert-success")
        .addClass("alert-primary")
        .text("Uploading file now...")
      
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
        $("#uploadAlert")
          .removeClass("alert-danger alert-info alert-primary")
          .addClass("alert-success")
          .text("File upload complete!")
        
        var siteid = $("#siteSelect").val();
        $.ajax({
          url:     `http://localhost:3000/api/v1/getMetadatasBySite?siteid=${siteid}`,
          method:  'GET',
          timeout: 3000
        }).done((metas) => {
          this.metasFromSite = metas;
          
          showColumnSelect();
          
          $("#uploadNextButton")
            .removeClass("d-none disabled")
            .off('click')
            .click(() => { reviewData(this.headers, this.fileData); });
        });
      } else {
        $("#uploadAlert")
          .removeClass("alert-danger alert-info alert-primary")
          .addClass("alert-danger")
          .text("Could not read the specified file.  Check the format and try again.")
      }
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
        "decimals":  decimals};
      
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
        
        // console.time("Set Values");
        
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
        // console.timeEnd("Set Values");
        
        // console.time("Update stats");
        
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
        // console.timeEnd("Update stats");
        
        // Now that we've calculated all the values, find determine if there's
        //   a gap between this entry and the last one entered.  If not,
        //   just push the new object; if so, set values to NaN and push.
        // console.time("Gap filling");
        if (i === 0) {
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
        // console.timeEnd("Gap filling");
      });
      // cmean = csum/returnData.length;
      
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
      
      // console.log(valueExtent + " - " + filledExtent + " - " + yextent);
      
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
      
      for (let i=0; i<h.measurements.length; i+=stepSize) {
        let m = h.measurements.slice(i, i+stepSize)
        let dataToLoad = {'metaid': h.metaid,
                          'offset': this.utcoffset,
                          'loadnumber': i/stepSize,
                          'measurements': m};
        //console.log("Starting Post #" + i/stepSize);
        calls.push(
          $.ajax({
            type: 'POST',
            url:  'http://localhost:3000/api/v1/measurements',
            contentType: 'application/json',
            data: JSON.stringify(dataToLoad),
            dataType: 'json',
            timeout: 8000
          }).done((data) => {
            // console.log("Server says: " + data);
            if (data != 'Success') {
              errors += m.length;
              // console.log("Upload failed for Post #" + i/stepSize);
            } else {
              successes += m.length;
              // console.log("Upload succeeded for Post #" + i/stepSize);
            }
            //console.log("Loaded Post #" + i/stepSize);
          }).fail((err) => {
            // console.log("Upload failed for Post #" + i/stepSize);
            errors += m.length;
          })
        );
      };
      
      Promise.all(calls)
      .then((result) => {
        console.log("All loads completed.");
        console.log("Errors: " + errors + "; Successes: " + successes);
        this.setWorkup(headerWithMeta);
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
        console.log("Workup loaded");
      }).fail((err) => {
        console.log("Workup load failed; " + err);
      });
    },
    
    clickUpload(headerWithMeta) {
      if (this.nOverlappingMeasurements == 0) {
        this.getMeasurementCount(headerWithMeta)
          .then((data) => { 
            this.nOverlappingMeasurements = data.measurementCount;
            if (this.nOverlappingMeasurements == 0) {
              this.uploadMeasurements(headerWithMeta);
            };
          });
      } else {
        this.deleteMeasurements(headerWithMeta)
          .then(() => {
            console.log("Deleted " + this.nOverlappingMeasurements + " measurements.");
            this.uploadMeasurements(headerWithMeta);
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
        this.qualifiers = data;
      }).fail((err) => {
        console.log(err);
      }).always(() => {
      }); 
    },
    
    reset() {
      this.filePath                = '';
      this.fileText                = '';
      this.headerMetadataMap       = {};
      this.nOverlappingMeasurments = 0;
      
      delete this.fileData.data;
    },
    
    roundToDecimal(number, decimal) {
      return Math.round(number*Math.pow(10, decimal))/Math.pow(10, decimal);
    }
  }
});

// Generic functions

// From column selection back to CSV upload
var showUpload = function() {
    console.log("showUpload");
    $("#uploadCSVContainer").removeClass("d-none");
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#uploadFileName").text("Select a File...");
    
    $("#uploadBackButton")
      .addClass("d-none")
      .off("click");
    
    $("#uploadNextButton")
      .removeClass("d-none")
      .addClass("disabled")
      .off("click");
    
    $("#uploadAlert")
      .removeClass("alert-success alert-danger alert-primary")
      .addClass("alert-info")
      .text("Select a File...")
};

var showColumnSelect = function() {
    console.log("showColumnSelect");
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadColumnSelectContainer").removeClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });
    
    $("#uploadAlert")
      .removeClass("alert-success alert-danger alert-primary")
      .addClass("alert-info")
      .text("Match the CSV headers with the correct metadata.")
};

// From column selection to data review
var showReview = function() {
    console.log("showReview");
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadReviewContainer").removeClass("d-none");
    
    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });
    
    $("#uploadNextButton")
      .addClass("d-none");
    
    $("#uploadAlert")
        .removeClass("alert-success alert-danger alert-primary")
        .addClass("alert-info")
        .text("Review uploaded data for accuracy.")
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

var reviewData = function(headers, fileData) {
  
  var data = fileData.data;
  
  // $("#uploadReviewTabContent").empty();
  
  // This isn't working properly.
  if (vm.columncount < 2) {
    $("#uploadAlert")
      .removeClass("alert-success alert-info alert-primary")
      .addClass("alert-danger")
      .text("You must select at least a date/time field and one parameter.")
      
    // $("#uploadReviewTabContent").empty()
      
  } else if(vm.dtmColName == null) {
    $("#uploadAlert")
      .removeClass("alert-success alert-info alert-primary")
      .addClass("alert-danger")
      .text("You must select one and only one date/time field.")
      
    // $("#uploadReviewTabContent").empty()
    
  } else {
    headers.forEach(header => {
      var headert    = header.trim();
      var metaid     = $("#uploadHeader" + header).val();
      var selectName = $("#uploadHeader"+ header + " :selected").text();
      var selectFreq = Number($("#uploadHeader"+ header + " :selected").data('frequency'));
    })
    
    showReview();
    
    $('#uploadReviewTab a:first').tab('show')
    
  };
};




var displayLoadStatus = function(errorCount, successCount, step, lastStep, stepSize, completeSteps) {
  console.log("step: " + step + "; lastStep: " + lastStep + "; errors: " + errorCount)
  if (completeSteps < (lastStep-stepSize)) {
    $("#uploadAlert")
      .removeClass(" alert-success alert-primary alert-danger")
      .addClass("alert-info")
      .text("Loading data; errors = " + errorCount)
  } else {
    if (errorCount == 0) {
      let countText = step == 1 ? " 1 record!": step + " records!"
      $("#uploadAlert")
        .removeClass("  alert-primary  alert-info alert-danger")
        .addClass("alert-success")
        .text("Successfully loaded " + countText);
    } else {
      $("#uploadAlert")
        .removeClass("alert-success alert-primary  alert-info ")
        .addClass("alert-danger")
        .text("Failed to load " + Math.min(errorCount*stepSize, lastStep) + " records, out of " + lastStep + ".")
    };
  };
}



