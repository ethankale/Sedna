
var Papa = require('papaparse');
var d3   = require('d3');

$(document).ready(function() {
    $("#siteSelect").change(function() {
        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadColumnSelectForm").empty();
        $("#uploadFileName").text("Select a File...");
    });
    
    $("#uploadColumnBackButton").click(function()  {
        $("#uploadCSVContainer").removeClass("d-none");
        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadReviewContainer").addClass("d-none");
        $("#uploadAlert")
            .removeClass("alert-success alert-danger alert-primary")
            .addClass("alert-info")
            .text("Select a File...")
    });
    
    $("#uploadReviewBackButton").click(function() {
        $("#uploadCSVContainer").addClass("d-none");
        $("#uploadColumnSelectContainer").removeClass("d-none");
        $("#uploadReviewContainer").addClass("d-none");
        $("#uploadAlert")
            .removeClass("alert-success alert-danger alert-primary")
            .addClass("alert-info")
            .text("Match the CSV headers with the correct metadata.")
    });
    
    $("#openCSVFileButton").click(function() {
        
        $("#uploadAlert")
            .removeClass("alert-danger alert-info alert-success")
            .addClass("alert-primary")
            .text("Uploading file now...")
        
        var [filePath, fileText] = window.openCSV();
        $("#uploadFileName").text(filePath);
        
        var fileData = Papa.parse(fileText, {header: true});
        var headers  = Object.keys(fileData.data[0]);
        
        $("#uploadAlert")
            .removeClass("alert-danger alert-info alert-primary")
            .addClass("alert-success")
            .text("File upload complete!")
        
        var siteid = $("#siteSelect").val();
        $.ajax({url: `http://localhost:3000/api/v1/getMetadatasBySite?siteid=${siteid}`
        }).done(function(metas) {
            var uploadHeaderMarkup = "";
            headers.forEach(header => {
                uploadHeaderMarkup += buildUploadColumnSelect(header, metas);
            })
            
            $("#uploadColumnSelectContainer").removeClass("d-none");
            $("#uploadCSVContainer").addClass("d-none");
            
            $("#uploadColumnSelectForm")
                .empty()
                .append("<form>\n" + uploadHeaderMarkup + "</form>\n");
            
            $("#uploadAlert")
                .removeClass("alert-success alert-danger alert-primary")
                .addClass("alert-info")
                .text("Match the CSV headers with the correct metadata.")
            
        });
        $("#uploadColumnSelectReviewButton").click(function() {
            reviewData(headers, fileData);
        });
    });
});

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
          var selectName = $("#uploadHeader"+ header + " :selected").text()
          
          // Figure out a way to pull out the date column + the selected column
          
          if (selectVal >= 0) {
            var csum = 0;
            var cmis = 0;
            var cmax = 0;
            var cmin = data[0][header];
            data.forEach((d, i, arr) => {
                d.Value = Number(d[header]);
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
            
            console.log(data);
            
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
              </div>\n`)
              .append(function() {graphColumn("#graph"+header, data)});
            
            
          }
        })
        
        
        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadCSVContainer").addClass("d-none");
        
        $("#uploadReviewContainer").removeClass("d-none");
        
        $("#uploadAlert")
            .removeClass("alert-success alert-danger alert-primary")
            .addClass("alert-info")
            .text("Review uploaded data for accuracy.")
        
    }
}


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
            value=${meta.MetadataID}>
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

// measurements needs be an object with 'dtm' and 'Value' arrays
function graphColumn(selector, measurements) {
    $(selector).empty();
    var margin = {top: 10, right: 60, bottom: 30, left: 40},
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
      .domain(d3.extent(measurements, function(d) { return new Date(d.dtm); }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
        .ticks(3));
    
    // Add Y axis
    var y = d3.scaleLinear()
      .domain(d3.extent(measurements, function(d) {return d.Value; }))
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));
    
    // Add the line
    svg.append("path")
      .datum(measurements)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .defined(d => !isNaN(d.Value))
        .x(function(d) { return x(new Date(d.dtm)) })
        .y(function(d) { return y(d.Value) })
        )
}

