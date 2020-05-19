
let Papa       = require('papaparse');
let d3         = require('d3');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let Vue        = require('vue');

var vm = new Vue({
  el: '#uploadModal',
  
  data: {
    filePath:       'Select a File...',
    fileText:       '',
    fileData:       {
      meta: {
        fields: []
      }
    },
    metasFromSite:  [],
    
    // Using negative numbers because metadata ids will always be >= zero.
    emptyID:        -1,
    datetimeID:     -2,
    qualifierID:    -3,
    depthID:        -4,
    
    // columnCount:    0,
    // datetimeCount:  0,
    
    // dtmColName:     "",
    // depthColName:   "",
    // qualColName:    "",
    
    headerMetadataMap: {},
    
    measurements:   [],
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
      return metaIDs.filter(m => m != this.emptyID).length;
    },
    
    dtmColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m == this.datetimeID).length;
      let name    = null;
      
      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = Object.values(this.headerMetadataMap);
        let i = v.findIndex(m => m==this.datetimeID);
        name = k[i];
      }
      return name;
    },
    
    qualColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m == this.qualifierID).length;
      let name    = null;
      
      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = Object.values(this.headerMetadataMap);
        let i = v.findIndex(m => m==this.qualifierID);
        name = k[i];
      }
      return name;
      // return count;
    },
    
    depthColName: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      let count   = metaIDs.filter(m => m == this.depthID).length;
      let name    = null;
      
      if (count === 1) {
        let k = Object.keys(this.headerMetadataMap);
        let v = Object.values(this.headerMetadataMap);
        let i = v.findIndex(m => m==this.depthID);
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
      let metaID = event.target.value;
      
      // console.log("Triggered reviewHeadingSelection() with " + metaID + " and " + header);
      
      // let map = this.headerMetadataMap;
      // map[header] = metaID;
      // this.headerMetadataMap = map;
      
      this.$set(this.headerMetadataMap, header, metaID);
      
      console.log(this.headerMetadataMap);
      console.log(
        this.dtmColName   + " | " + 
        this.qualColName  + " | " + 
        this.depthColName + " | "
      );
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
    
    $("#uploadNextButton")
      .removeClass("d-none")
      .off("click")
      .click(function() {reviewData(headers, fileData); });
    
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
      // $("#uploadColumnSelectForm").empty();
      // $("#uploadFileName").text("Select a File...");
    });
    
    $("#openCSVFileButton").click(() => {
      vm.openCSV();
    });
});

var reviewData = function(headers, fileData) {
    
    var data = fileData.data;
    
    $("#uploadReviewTab").empty()
    $("#uploadReviewTabContent").empty()
    
    
    if (vm.columncount < 2) {
        $("#uploadAlert")
            .removeClass("alert-success alert-info alert-primary")
            .addClass("alert-danger")
            .text("You must select at least a date/time field and one parameter.")
            
        $("#uploadReviewTab").empty()
        $("#uploadReviewTabContent").empty()
        
    } else if(vm.dtmColName == null) {
        $("#uploadAlert")
            .removeClass("alert-success alert-info alert-primary")
            .addClass("alert-danger")
            .text("You must select one and only one date/time field.")
            
        $("#uploadReviewTab").empty()
        $("#uploadReviewTabContent").empty()
        
    } else {
    
    // Second loop.  Now that we have the date/time column,
    //   and we validated the data, we can do everything else.
        headers.forEach(header => {
          var headert    = header.trim();
          var selectVal  = $("#uploadHeader" + header).val();
          var selectName = $("#uploadHeader"+ header + " :selected").text();
          var selectFreq = Number($("#uploadHeader"+ header + " :selected").data('frequency'));
          
          if (selectVal >= 0) {
            
            var csum = 0;
            var cmis = 0;
            var cmax = 0;
            var cmin = Number(data[0][header]);
            data.forEach((d, i, arr) => {
              // Javascript interprets the date in the local time zone,
              //   which will probably have DST.
              d.jsdate = lx.DateTime.fromJSDate(new Date(d[vm.dtmColName] + utcHoursString))
                .setZone(utcstring);
              d.dtm = d.jsdate;
              
              d.Value       = d[header].trim() == '' ? NaN  : Number(d[header]);
              d.Depth_M     = vm.depthColName == ''  ? null : d[vm.depthColName];
              d.QualifierID = null;
              
              if (vm.qualColName != '') {
                let qualifierobj = qualifiers.find(o => o.Code.trim() === d[vm.qualColName]);
                d.QualifierID = typeof qualifierobj == 'undefined' ? null : qualifierobj.QualifierID;
              };
              
              if (isNaN(d.Value)) {
                cmis += 1;
              } else {
                csum += d.Value;
                cmax = d.Value > cmax ? d.Value : cmax;
                cmin = d.Value < cmin ? d.Value : cmin;
              }
              arr[i] = d;
            });
            
            let dataFilled = isNaN(selectFreq) ? data : fillGaps(data, selectFreq, "dtm", "Value");
            
            cmis += (dataFilled.length - data.length);
            
            $("#uploadReviewTab").append(
              `<li class="nav-item">
                <a class="nav-link" id="${header}-tab" data-toggle="tab" href="#${header}" role="tab" aria-controls="${header}">${headert}</a>
              </li>\n`
            );
            
            $("#uploadReviewTabContent").append(
              `<div class="tab-pane fade" id="${header}" role="tabpanel" aria-labelledby="${header}-tab">
              <h5 class="row mt-3">${selectName}</h5>
              <div id="graph${header}"></div>
              <table class="table">
                <tbody>
                  <tr> <th scope="row">Count</th>       <td>${data.length}</tr>
                  <tr> <th scope="row">Sum</th>         <td>${csum.toFixed(2)}</tr>
                  <tr> <th scope="row">Missing/Bad</th> <td>${cmis}</tr>
                  <tr> <th scope="row">Max</th>         <td>${cmax.toFixed(2)}</tr>
                  <tr> <th scope="row">Mean</th>        <td>${(csum/data.length).toFixed(2)}</tr>
                  <tr> <th scope="row">Min</th>         <td>${cmin.toFixed(2)}</tr>
                </tbody>
              </table>
                  <form>
                    <div class="row">
                      <div class="col-3">
                        <input type="text" class="form-control" id="offset${header}" placeholder="Offset">
                      </div>
                      <div class="col-3">
                        <input type="text" class="form-control" id="drift${header}" placeholder="Drift">
                      </div>
                      <div class="col-3">
                        <button id="correct${header}" type="button" class="btn btn-outline-primary">Correct</button>
                      </div>
                      <div class="col-3">
                        <button id="upload${header}" type="button" class="btn btn-outline-primary">Upload</button>
                      </div>
                    </div>
                  </form>
              </div>\n`)
              // Because we're adding listeners to the markup that's appended above, we have to
              //   wait for the first append to complete so the DOM is ready for the listeners.
              .append(function() {
                  graphColumn("#graph"+header, dataFilled, 'dtm', 'Value');
                  
                  var dataAdjusted = [];
                  let adjustedCol = 'ValueAdjusted';
                  
                  $("#correct"+header).click(() => {
                      //console.log($("#offset"+header).val() + $("#drift"+header).val());
                      let offset = Number($("#offset"+header).val());
                      let drift  = Number($("#drift"+header).val());
                      
                      offset = isNaN(offset) ? 0 : offset;
                      drift  = isNaN(drift)  ? 0 : drift;
                      
                      dataAdjusted = adjustValues(dataFilled, 'Value', offset, drift, adjustedCol)
                      console.log(dataAdjusted);
                      graphColumn("#graph"+header, dataAdjusted, 'dtm', 'Value', adjustedCol);
                  });
                  $("#upload"+header).click(() => {
                      
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
                        d_new.Value        = typeof d[adjustedCol] == 'undefined' ? d.Value : d[adjustedCol];
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
                        "metaid":    selectVal,
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
                        // console.log("Number of existing records: " + rowcount);
                        // console.log(finalData);
                        if (rowcount > 0) {
                          $("#uploadAlert")
                            .removeClass("alert-success  alert-primary  alert-info")
                            .addClass("alert-danger")
                            .text("There are already " + rowcount + " records in the database.  Overwrite?")
                          
                          $(`#upload${header}`).text("Overwrite?");
                          $(`#upload${header}`).off("click");
                          $(`#upload${header}`).click(() => { 
                            deleteMeasurements(selectVal, mindate, maxdate, finalData) 
                          });
                        
                        } else {
                          uploadMeasurements(finalData, selectVal);
                        };
                      });
                  });
              });
          }
        })
        
        showReview();
        
        $('#uploadReviewTab a:first').tab('show')
        
    }
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

// There are two kinds of gap filling.  The first is to add missing rows
//   where the date-time field indicates that data are missing.  The second
//   is to interpolate values where they are missing.  This function
//   only does the FIRST - adds rows.
var fillGaps = function(data, freq, datecol, valuecol) {
    var newarr = [];
    
    data.forEach((d, i, arr) => {
        let d_copy = {...d};
        if (i==0) {
            newarr.push(d_copy);
        } else {
            var lastDate     = arr[i-1][datecol];
            var currentDate  = arr[i][datecol];
            var diff         = (currentDate - lastDate)/(1000*60); // Minutes
            var ntoinsert    = diff/freq;
            
            if (isFinite(ntoinsert)) {
            
                for (let j=1; j<=ntoinsert; j++) {
                    //let insertDate = new Date(lastDate);
                    insertDate = lastDate.plus({ minutes: j*freq });
                    //insertDate.setMinutes(lastDate.getMinutes() + (j*freq));
                    
                    d_copy[valuecol] = j == ntoinsert ? d_copy[valuecol] : NaN;
                    
                    let d_new = {...d_copy};
                    d_new[datecol] = insertDate;
                    
                    newarr.push(d_new);
                };
            } else {
                //console.log("Detected infinite value - data spacing may be bad.");
                newarr.push(d_copy);
            }
        };
    });
    return newarr;
};

// Naively assumes no gaps in timesteps.  Use fillGaps first.
// Offset - difference between actual and recorded value at first timestep.
// Drift - difference between actual and the offset plus recorded value at last timestep.
// Example: if your recorded values at first and last timestep are both five, and the
//   actual values are 4 and 7, then the offset is -1 (4-5) and the drift is 3 (7-[5-1]).
var adjustValues = function(arr, valuecol, offset, drift, newcol) {
    var newarr = [];
    var stepchange = drift/arr.length;
    
    arr.forEach((d, i, arr) => {
        let d_copy = {...d};
        d_copy[newcol] = d_copy[valuecol] + ((stepchange*i)+offset);
        newarr.push(d_copy);
    });
    return newarr;
};

// measurements needs be an object with 'dtm' and 'Value' arrays
var graphColumn = function(selector, measurements, datecol, valuecol, filledval) {
    $(selector).empty();
    var margin = {top: 10, right: 60, bottom: 30, left: 60},
        width = $("#uploadModal .modal-content").width() - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;
    // append the svg object to the body of the page
    var svg = d3.select(selector)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
      .domain(d3.extent(measurements, function(d) { return new Date(d[datecol]); }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
        .ticks(3));
    
    let valueExtent  = d3.extent(measurements, function(d) {return d[valuecol]; });
    let filledExtent = typeof filledval == 'undefined' ? valueExtent : d3.extent(measurements, function(d) {return d[filledval]; });
    //let filledExtent = d3.extent(measurements, function(d) {return d[filledval]; });
    let yextent = [d3.min(valueExtent.concat(filledExtent)), d3.max(valueExtent.concat(filledExtent))]
    
    console.log(valueExtent + " - " + filledExtent + " - " + yextent);
    
    // Add Y axis
    var y = d3.scaleLinear()
      .domain(yextent)
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));
    
    if (typeof filledval !== 'undefined') {
      svg.append("path")
        .datum(measurements)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2.5)
        .attr("d", d3.line()
          .defined(d => !isNaN(d[filledval]))
          .x(function(d) { return x(new Date(d[datecol])) })
          .y(function(d) { return y(d[filledval]) })
          )
    }
    
    // Add the line
    svg.append("path")
      .datum(measurements)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .defined(d => !isNaN(d[valuecol]))
        .x(function(d) { return x(new Date(d[datecol])) })
        .y(function(d) { return y(d[valuecol]) })
        )
}

