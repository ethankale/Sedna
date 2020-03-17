
var Papa = require('papaparse');
var d3   = require('d3');
var alqwuutils = require('./utils.js');

// From CSV upload to column selection

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
    $("#siteSelect").change(function() {
        $("#uploadCSVContainer").removeClass("d-none");
        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadReviewContainer").addClass("d-none");
        $("#uploadBackButton").addClass("d-none");
        $("#uploadNextButton").addClass("d-none");
        $("#uploadColumnSelectForm").empty();
        $("#uploadFileName").text("Select a File...");
    });
    
    
    $("#openCSVFileButton").click(function() {
        
        $("#uploadAlert")
            .removeClass("alert-danger alert-info alert-success")
            .addClass("alert-primary")
            .text("Uploading file now...")
        
        var [filePath, fileText] = window.openCSV();
        $("#uploadFileName").text(filePath);
        
        let papaConfig = {
            delimiter: ',',
            quoteChar: '"',
            header: true, 
            skipEmptyLines: true,
            fastMode: false,
            transformHeader: function(h) {
                return h.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_ -]/g, '');
            }
        };
        
        // Even with the transform header function we may get some column names
        //   that are invalid selectors.  in theory we could search for the CSS
        //   valid selector regex -?[_a-zA-Z]+[_a-zA-Z0-9-]* and replace anything
        //   that doesn't match, but replace with what?
        
        var fileData = Papa.parse(fileText, papaConfig);
        var headers  = Object.keys(fileData.data[0]);
        //console.log(headers);
        
        $("#uploadAlert")
            .removeClass("alert-danger alert-info alert-primary")
            .addClass("alert-success")
            .text("File upload complete!")
        
        var siteid    = $("#siteSelect").val();
        $.ajax({url: `http://localhost:3000/api/v1/getMetadatasBySite?siteid=${siteid}`
        }).done(function(metas) {
            var uploadHeaderMarkup = "";
            headers.forEach(header => {
                uploadHeaderMarkup += buildUploadColumnSelect(header, metas);
            })
            
            showColumnSelect();
            
            $("#uploadColumnSelectForm")
              .empty()
              .append("<form>\n" + uploadHeaderMarkup + "</form>\n");
            $("#uploadNextButton")
              .removeClass("d-none disabled")
              .off('click')
              .click(function() {reviewData(headers, fileData); });
        });
    });
});


// There are some magic numbers here (sorry).
// Using negative numbers because metadata ids will always be positive.
//   -1 = Empty (ignore the column during import)
//   -2 = Date and Time
//   -3 = Flag/qualifier
var buildUploadColumnSelect = function(colname, metas) {
    var metaoptions = `
        <option value=-1>Blank</option>\n
        <option value=-2>Date and Time</option>\n
        <option value=-3>Flag or Qualifier</option>\n`;
    
    metas.forEach(meta => {
        metaoptions += `<option
            value=${meta.MetadataID}
            data-frequency=${meta.FrequencyMinutes}>
            ${meta.Parameter} (${meta.Method})
            </option>\n`
    });
    
    return `<div class="form-group">
        <label for="uploadHeader${colname}">${colname.trim()}</label>
        <select class="form-control" id="uploadHeader${colname}">
        ${metaoptions}
        </select>
      </div>\n`
}

var reviewData = function(headers, fileData) {
    
    var data = fileData.data;
    
    var columncount   = 0;
    var datetimecount = 0;
    
    $("#uploadReviewTab").empty()
    $("#uploadReviewTabContent").empty()
    
    // First of two loops (lame).  Pull out the date/time column, and do validation.
    var dtmColName = "";
    headers.forEach(header => {
      var headert   = header.trim();
      var selectVal = $("#uploadHeader" + header).val();
      
      columncount   += selectVal == -1 ? 0 : 1;
      datetimecount += selectVal == -2 ? 1 : 0;
      
      dtmColName = $("#uploadHeader" + header).val() == -2 ? header : dtmColName;
    });
    
    if (columncount < 2) {
        $("#uploadAlert")
            .removeClass("alert-success alert-info alert-primary")
            .addClass("alert-danger")
            .text("You must select at least a date/time field and one parameter.")
            
        $("#uploadReviewTab").empty()
        $("#uploadReviewTabContent").empty()
        
    } else if(datetimecount != 1) {
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
          
          // Figure out a way to pull out the date column + the selected column
          
          if (selectVal >= 0) {
            
            var csum = 0;
            var cmis = 0;
            var cmax = 0;
            var cmin = Number(data[0][header]);
            data.forEach((d, i, arr) => {
                d.Value = d[header].trim() == '' ? NaN : Number(d[header]);
                d.dtm   = new Date(d[dtmColName]);
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
            console.log(dataFilled);
            
            cmis += (dataFilled.length - data.length)
            
            //console.log(dataFilled);
            
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
                      
                      let interimData = dataAdjusted.length > 0 ? dataAdjusted : dataFilled;
                      let finalData = [];
                      console.log(dataAdjusted.length);
                      
                      interimData.forEach((d, i, arr) => {
                          let d_new = {};
                          
                          d_new.Value  = typeof d[adjustedCol] == 'undefined' ? d.Value : d[adjustedCol];
                          d_new.dtm    = alqwuutils.formatDateForSQL(d.dtm);
                          d_new.metaid = selectVal;
                          
                          finalData.push(d_new);
                      });
                      
                      let step = 20;
                      for (let i=0; i<finalData.length; i+=step) {
                        let dataToLoad = finalData.slice(i, i+step);
                        //console.log(dataToLoad.length);
                        
                        $.post({
                          contentType: 'application/json',
                          data: JSON.stringify(dataToLoad),
                          dataType: 'json',
                          success: function(data){
                              console.log("Upload successful!");
                          },
                          error: function(){
                              console.log("Upload failed.");
                          },
                          processData: false,
                          type: 'POST',
                          url: 'http://localhost:3000/api/v1/measurements'
                        });
                      }
                  });
              });
          }
        })
        
        showReview();
        
        $('#uploadReviewTab a:first').tab('show')
        
    }
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
                    let insertDate = new Date(lastDate);
                    insertDate.setMinutes(lastDate.getMinutes() + (j*freq));
                    
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
}


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

