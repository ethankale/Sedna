
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
        
        console.log(filePath);
        console.log(headers);
        console.log(fileData);
        
        $("#uploadAlert")
            .removeClass("alert-danger alert-info alert-primary")
            .addClass("alert-success")
            .text("File upload complete!")
        
        var siteid = $("#siteSelect").val();
        $.ajax({url: `http://localhost:3000/api/v1/getMetadatasBySite?siteid=${siteid}`
        }).done(function(metas) {
            var uploadHeaderMarkup = "";
            headers.forEach(header => {
                uploadHeaderMarkup += buildUploadColumnSelect(header.trim(), metas);
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
    var reviewTabMarkup = "";
    var reviewTabContentMarkup = "";
    
    var columncount   = 0;
    var datetimecount = 0;
    
    headers.forEach(header => {
      var headert    = header.trim();
      var selectVal  = $("#uploadHeader" + headert).val();
      var selectName = $("#uploadHeader"+ headert + " :selected").text()
      
      columncount   += selectVal == -1 ? 0 : 1;
      datetimecount += selectVal == -2 ? 1 : 0;
      
      if (selectVal >= 0) {
        var columnData = data.map(col => Number(col[headert]));
        var csum = 0;
        var cmis = 0;
        var cmax = 0;
        var cmin = columnData[0];
        columnData.forEach(d => {
            if (isNaN(d)) {
                cmis += 1;
            } else {
                csum += d;
                cmax = d > cmax ? d : cmax;
                cmin = d < cmin ? d : cmin;
            }
        });
        reviewTabMarkup += 
          `<li class="nav-item">
            <a class="nav-link" id="${headert}-tab" data-toggle="tab" href="#${headert}" role="tab" aria-controls="${headert}">${headert}</a>
          </li>\n`;
        reviewTabContentMarkup += 
          `<div class="tab-pane fade" id="${headert}" role="tabpanel" aria-labelledby="${headert}-tab">
          <h5 class="row mt-3">${selectName}</h5>
          <table class="table">
            <tbody>
              <tr> <th scope="row">Count</th>       <td>${columnData.length}</tr>
              <tr> <th scope="row">Sum</th>         <td>${csum.toFixed(2)}</tr>
              <tr> <th scope="row">Missing/Bad</th> <td>${cmis}</tr>
              <tr> <th scope="row">Max</th>         <td>${cmax.toFixed(2)}</tr>
              <tr> <th scope="row">Mean</th>        <td>${(csum/columnData.length).toFixed(2)}</tr>
              <tr> <th scope="row">Min</th>         <td>${cmin.toFixed(2)}</tr>
            </tbody>
          </table>
          </div>\n`;
      }
    })
    
    if (columncount < 2) {
        $("#uploadAlert")
            .removeClass("alert-success alert-info alert-primary")
            .addClass("alert-danger")
            .text("You must select at least a date/time field and one parameter.")
    } else if(datetimecount != 1) {
        $("#uploadAlert")
            .removeClass("alert-success alert-info alert-primary")
            .addClass("alert-danger")
            .text("You must select one and only one date/time field.")
    } else {
        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadCSVContainer").addClass("d-none");
        
        $("#uploadReviewTab")
            .empty()
            .append(reviewTabMarkup);
        
        $("#uploadReviewTabContent")
            .empty()
            .append(reviewTabContentMarkup);
        
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
        <label for="uploadHeader${colname}">${colname}</label>
        <select class="form-control" id="uploadHeader${colname}">
        ${metaoptions}
        </select>
      </div>\n`
}



