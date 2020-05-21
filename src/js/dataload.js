
let Papa       = require('papaparse');
let d3         = require('d3');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let Vue        = require('vue');

var vm = new Vue({
  el: '#uploadModal',
  
  data: {
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
          h.cmis  = r[1];
          h.csum  = r[2];
          h.cmax  = r[3];
          h.cmin  = r[4];
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
      // return count;
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
      // let cmean = Number(data[0][header]);
      
      let stepchange = 0;
      
      let firstdate = lx.DateTime
        .fromJSDate(new Date(data[0][this.dtmColName] + utcHoursString))
        .setZone(utcstring);
      let lastdate  = lx.DateTime
        .fromJSDate(new Date(data[data.length-1][this.dtmColName] + utcHoursString))
        .setZone(utcstring); 
      
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
          .fromJSDate(new Date(d[this.dtmColName] + utcHoursString))
          .setZone(utcstring);
        d2.CollectedDTM = d2.jsdate;
        
        // console.time("Set Values");
        
        d2.ValueOriginal        = d[header].trim() == ''   ? NaN  : Number(d[header]);
        d2.Depth_M              = this.depthColName == ''  ? null : d[this.depthColName];
        d2.QualifierID          = null;
        d2.MeasurementCommentID = null;
        d2.MeasurementQualityID = null;
        d2.MetadataID           = metaid;
        d2.CollectedDTMOffset   = utcoffset;
        
        d2.Value = this.roundToDecimal((d2.ValueOriginal + ((stepchange*n) + offset)), decimals);
        
        if (this.qualColName != '') {
          let qualifierobj = qualifiers.find(o => o.Code.trim() === d[this.qualColName]);
          d2.QualifierID = typeof qualifierobj == 'undefined' ? null : qualifierobj.QualifierID;
        };
        // console.timeEnd("Set Values");
        
        // console.time("Update stats");
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
      
      return [returnData, cmis, csum, cmin, cmax];
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
    
    roundToDecimal(number, decimal) {
      return Math.round(number*Math.pow(10, decimal))/Math.pow(10, decimal);
    }
  }
});

// Difference between supplied times and UTC (measurementtime-UTC), in minutes; -480 in PST
let utcHours       = alqwuutils.utcoffset;
let utcoffset      = Math.floor(utcHours*60);
let utcHoursString = utcHours < 0 ? utcHours.toString() : "+" + utcHours.toString()
// Difference between computer time and UTC (comptime-UTC), in minutes; -480 in PST and -420 in PDT
let currentoffset  = lx.DateTime.fromJSDate(new Date()).o
let utcstring      = alqwuutils.utcOffsetString(utcoffset);
// Globals
let qualifiers = [];

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
}

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
    getQualifiers();
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

var uploadMeasurements = function(finalData, metaid) {
  let errors        = 0;
  let successes     = 0;
  let completeSteps = 0;
  let stepSize      = 30;    // The max number of rows to bulk insert.
  for (let i=0; i<finalData.length; i+=stepSize) {
    let dataToLoad = {'metaid': metaid,
                      'offset': utcoffset,
                      'loadnumber': i/stepSize,
                      'measurements': finalData.slice(i, i+stepSize)};
    //console.log("Starting Post #" + i/stepSize);
    
    $.ajax({
      type: 'POST',
      url: 'http://localhost:3000/api/v1/measurements',
      contentType: 'application/json',
      data: JSON.stringify(dataToLoad),
      dataType: 'json',
      timeout: 8000
    }).done((data) => {
          console.log("Server says: " + data);
          if (data != 'Success') {
            errors += 1;
          } else {
            successes += 1;
          }
          //console.log("Loaded Post #" + i/stepSize);
    }).fail((err) => {
          console.log("Upload failed for Post #" + i/stepSize);
          errors += 1;
    }).always(() => {
      displayLoadStatus(errors, successes, i, finalData.length, stepSize, completeSteps);
      completeSteps += stepSize;
    }); 
  };
}

let deleteMeasurements = function(metaid, mindtm, maxdtm, finalData) {
  let body = {
    'MetadataID': metaid,
    'MinDtm': mindtm, 
    // 'MinDtm': new lx.DateTime(mindtm).minus({minutes: utcoffset}), 
    'MaxDtm': maxdtm
    // 'MaxDtm': new lx.DateTime(maxdtm).minus({minutes: utcoffset})
  };
  
  console.log(body);
  
  $.ajax({
    type: 'DELETE',
    url: 'http://localhost:3000/api/v1/measurements',
    contentType: 'application/json',
    data: JSON.stringify(body),
    dataType: 'json',
    timeout: 3000
  }).done((data) => {
    console.log("Server says: " + data);
    $("#uploadAlert")
      .removeClass("alert-info  alert-primary alert-danger")
      .addClass("alert-success")
      .text("Deleted data");
    uploadMeasurements(finalData, metaid);
    //console.log("Loaded Post #" + i/stepSize);
  }).fail((err) => {
    console.log(err);
    $("#uploadAlert")
      .removeClass("alert-info alert-success alert-primary ")
      .addClass("alert-danger")
      .text("Failed to delete data");
  }).always(() => {
  }); 
};

let getQualifiers = function() {
  $.ajax({
    type:        'GET',
    url:         'http://localhost:3000/api/v1/qualifierList',
    contentType: 'application/json',
    dataType:    'json',
    timeout:     3000
  }).done((data) => {
    qualifiers = data;
  }).fail((err) => {
    console.log(err);
  }).always(() => {
  }); 
};

let setWorkup = function(values) {
  let request = $.ajax({
    type:        'POST',
    url:         'http://localhost:3000/api/v1/workup',
    data:        values,
    contentType: 'application/json',
    dataType:    'json',
    timeout:     '3000'
  });
  return(request);
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


let finalReview = function(header, dataFilled, metaid) {
  graphColumn("#graph"+header, dataFilled, 'dtm', 'Value');
  
  let dataAdjusted = [];
  
  $("#correct"+header).click(() => {
    dataAdjusted = clickCorrect(header, dataFilled);
  });
  
  $("#upload"+header).click(() => {
    clickUpload(header, dataFilled, dataAdjusted, metaid);
  });
};

let clickUpload = function(header, dataFilled, dataAdjusted, metaid) {
  $("#uploadAlert")
    .removeClass("alert-success  alert-primary alert-danger")
    .addClass("alert-info")
    .text("Uploading data...")
  
  let interimData = dataAdjusted.length > 0 ? dataAdjusted : dataFilled;
  let finalData = [];
  let mindate   = lx.DateTime.local(3000,01,01);
  let maxdate   = lx.DateTime.local(1000,01,01);
  
  interimData.forEach((d, i, arr) => {
    let d_new = {};
    
    // Use the values that were adjusted for offset and drift; 
    //   if no adjustment was performed, use the original values.
    d_new.Value        = typeof d[vm.adjustedColName] == 'undefined' ? d.Value : d[vm.adjustedColName];
    d_new.CollectedDTM = d.dtm;
    d_new.QualifierID  = d.QualifierID;
    d_new.Depth_M      = d.Depth_M;
    
    // Not using these (yet), so leave null.
    d_new.MeasurementCommentID = null;
    d_new.MeasurementQualityID = null;
    
    mindate = d_new.CollectedDTM > mindate ? mindate : d_new.CollectedDTM;
    maxdate = d_new.CollectedDTM < maxdate ? maxdate : d_new.CollectedDTM;
    
    finalData.push(d_new);
  });
  
  mindate = mindate.setZone('UTC');
  maxdate = maxdate.setZone('UTC');
  
  let data = {
    "metaid":    metaid,
    "startdtm":  mindate.toString(),
    "enddtm":    maxdate.toString(),
    "utcoffset": utcoffset
  };
  
  $.ajax({
    url:         'http://localhost:3000/api/v1/getMeasurementCount',
    contentType: 'application/json',
    type:        'GET',
    data:        data,
    timeout:     3000
  }).done(function(data) {
    let rowcount = parseInt(data.measurementCount);
    if (rowcount > 0) {
      $("#uploadAlert")
        .removeClass("alert-success alert-primary alert-info")
        .addClass("alert-danger")
        .text("There are already " + rowcount + " records in the database.  Overwrite?")
      
      $(`#upload${header}`).text("Overwrite?");
      $(`#upload${header}`).off("click");
      $(`#upload${header}`).click(() => { 
        deleteMeasurements(metaid, mindate, maxdate, finalData) 
      });
    
    } else {
      uploadMeasurements(finalData, metaid);
    };
  });
};

