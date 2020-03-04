
var Papa       = require('papaparse');

$(document).ready(function() {
    $("#siteSelect").change(function() {
        $("#uploadColumnSelectContainer").addClass("d-none");
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
                uploadHeaderMarkup += buildUploadColumnSelect(header, metas);
            })
            
            $("#uploadColumnSelectContainer").removeClass("d-none");
            $("#uploadColumnSelectForm")
                .empty()
                .append("<form>\n" + uploadHeaderMarkup + "</form>\n");
            
        });
        $("#uploadColumnSelectReviewButton").click(function() {
            $("#uploadColumnSelectContainer").addClass("d-none");
            $("#uploadReviewContainer").removeClass("d-none");
            reviewData(fileData);
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

var reviewData = function(data) {
    
}


