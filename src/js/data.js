
// Node modules.  Remember to run browserify every time to bundle this.
// browserify src/js/data.js -o src/js/data_bundle.js

var datefns    = require('date-fns');
var Papa       = require('papaparse');
var alqwuutils = require('./utils.js');
var dataload   = require('./dataload.js')

var sites        = [];
var sitecurrent  = 0;
var sitesMarkup  = "";

var params        = [];
var paramcurrent  = 0;
var methodcurrent = 0;
var paramMarkup   = "";

var wylist       = [];
var wycurrent    = 0;
var wymarkup     = "";

var measurements = []

$(document).ready(function() {
    
    /*
    window.onerror = function(msg, url, line, col, error) {
        console.log(msg + "; " + line + "; " + col);
        console.log(error);
    }
    */
    
    $("#downloadParameterSelect").select2();
    
    $("#downloadDataButton").click(function() {
        var startdtm  = new Date($("#downloadStartDate").val());
        var enddtm    = new Date($("#downloadEndDate").val());
        var paramList = $("#downloadParameterSelect").val();
        var filename  = $("#downloadFileName").val();
        
        if (paramList.length > 0 && !isNaN(startdtm) && !isNaN(enddtm) && filename.length > 0) {
            var paramids  = [];
            var methodids = [];
            paramList.forEach(param => {
                paramids.push(param.split("|")[0]);
                methodids.push(param.split("|")[1]);
            });
            $("#downloadAlert")
                .removeClass("alert-danger alert-info alert-success")
                .addClass("alert-primary")
                .text("Downloading now...")
            
            downloadMeasurements(
                sitecurrent, 
                paramids, 
                methodids,
                startdtm,
                enddtm, 
                alqwuutils.utcoffset*-1
            );
        } else {
            $("#downloadAlert")
                .removeClass("alert-primary alert-info alert-success")
                .addClass("alert-danger")
                .text("Valid start date, end date, parameters, and file name are all required.");
        };
    });
    
    $("#siteSelect").change(function() {
        measurements = [];
        sitecurrent = $("#siteSelect").val();
        $("#downloadFileName").val("c:/data/data.csv");
        $("#chartContainer").empty();
        loadParamList(sitecurrent);
    });
    
    // These are the two date inputs - start and end date
    $("#date-select-row input").change(function() {
        updateDates();
    });
    
    $("#wylist").change(function() {
        wycurrent = $("#wylist").val();
        var firstdtm  = new Date(`${wycurrent-1}-10-01T00:00:00`);
        var lastdtm   = new Date(`${wycurrent}-09-30T00:00:00`);

        
        $("#startDate").val(datefns.format(firstdtm, 'yyyy-MM-dd'));
        $("#endDate").val(datefns.format(lastdtm, 'yyyy-MM-dd'));
        
        updateDates();
    });
    
    loadSites();
});


function loadSites() {
    $.ajax({url: "http://localhost:3000/api/v1/getSites"
    }).done(function(data) {
        sites = data;
        sites.forEach(site => sitesMarkup += '<option value="' + 
            site.SiteID + '">' + 
            site.Code + ': ' + site.Name + '</option>\n');
        $('#siteSelect')
            .empty()
            .append(sitesMarkup)
            .change()
            .select2();
    });
}

function loadParamList(siteid) {
    $.ajax({url: `http://localhost:3000/api/v1/getParamsBySite?siteid=${siteid}`
    }).done(function(data) {
        params = data;
        paramMarkup = "";
        var downloadParamMarkup = "";
        
        params.forEach(param => {
            param.maxdtm = new Date(param.maxdtm);
            param.mindtm = new Date(param.mindtm);
            paramMarkup += `<a href="#"
                data-paramid=${param.ParameterID} 
                data-methodid=${param.MethodID} 
                data-lastcollectdtm=${param.maxdtm.toLocaleDateString()} 
                data-firstcollectdtm=${param.mindtm.toLocaleDateString()} 
                class="list-group-item list-group-item-action">
                <h5>${param.Name}</h5>
                <small>${param.Method}</small>
                </a>\n`;
            
            downloadParamMarkup += `<option 
                value=${param.ParameterID}|${param.MethodID}>
                ${param.Name} (${param.Method})
                </option>`
            
        });
        paramMarkup = '<div class="list-group list-group-flush">' + paramMarkup + "</div>";
        $('#downloadParameterSelect').empty().append(downloadParamMarkup);
        
        $('#paramList').empty().append(paramMarkup);
        $("#paramList div a").click(function() {
            
            $("#paramList div a").removeClass('active');
            $(this).addClass('active');
            
            var lastdtm   = new Date($(this).data("lastcollectdtm"));
            var wateryear = alqwuutils.calcWaterYear(lastdtm);
            var firstdtm  = new Date(`${wateryear-1}-10-01T00:00:00`);
            
            $("#startDate").val(datefns.format(firstdtm, 'yyyy-MM-dd'));
            $("#endDate").val(datefns.format(lastdtm, 'yyyy-MM-dd'));
            
            paramcurrent  = $(this).data("paramid");
            methodcurrent = $(this).data("methodid");
            
            wymarkup = "";
            wylist = alqwuutils.createWYList(new Date($(this).data("firstcollectdtm")), lastdtm);
            wylist.forEach(wy => {
                wymarkup += `<option value=${wy}>${wy}</option>\n`
            });
            $('#wylist').empty().append(wymarkup).val(wylist[wylist.length-1]);
            //$('#wylist').val(wylist[wylist.length-1]);
            
            updateDates();
        });
        $("#paramList div a:first").click();
    });
}

function loadMeasurements(siteid, paramid, methodid, startdtm, enddtm, utcoffset) {
    var dateoptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    
    var startdtmstring = startdtm.toLocaleDateString("en-US", dateoptions);
    var enddtmstring   = enddtm.toLocaleDateString("en-US", dateoptions);
    
    var url = 'http://localhost:3000/api/v1/getMeasurements' +
        '?siteid='    + siteid +
        '&paramid='   + paramid +
        '&methodid='  + methodid +
        '&startdtm='  + startdtmstring +
        '&enddtm='    + enddtmstring +
        '&utcoffset=' + utcoffset
    
    $.ajax({url: url
        }).done(function(data) {
            measurements = data;
            measurements.forEach(function(d) {
                d.dtm = Date.parse(d.CollectedDtm);
            });
            graphMeasurements();
    });
}
function downloadMeasurements(siteid, paramids, methodids, startdtm, enddtm, utcoffset) {
    var dateoptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    
    var startdtmstring = startdtm.toLocaleDateString("en-US", dateoptions);
    var enddtmstring   = enddtm.toLocaleDateString("en-US", dateoptions);
    
    var paramidsString  = "";
    var methodidsString = "";
    
    paramids.forEach(paramid => { paramidsString += "&paramids=" + paramid })
    methodids.forEach(methodid => { methodidsString += "&methodids=" + methodid })
    
    var url = 'http://localhost:3000/api/v1/getMeasurementDetails' +
        '?siteid='      + siteid +
        paramidsString  +
        methodidsString +
        '&startdtm='    + startdtmstring +
        '&enddtm='      + enddtmstring +
        '&utcoffset='   + utcoffset;
    
    $.ajax({url: url
    }).done(function(data) {
        measurements = data;
        measurements.forEach(function(d) {
            //d.localDTM = datefns.format(datefns.parse(d.CollectedDtm, "yyyy-MM-dd[T]HH:mm:ss.SSS[Z]", new Date()),"yyyy-MM-dd HH:mm:ss");
            
            // This is super ugly, but date-fns insists on treating every date like it's UTC, 
            //   and I specifically want all the dates in the front end to be local, 
            //   with UTC on the back end.
            d.CollectedDtm = d.CollectedDtm.replace("T", " ").replace("Z", " ").trim();
        });
        
        window.writeText(Papa.unparse(data), $("#downloadFileName").val());
        
        if (window.writeFileStatus == "Success") {
          $("#downloadAlert")
              .removeClass("alert-danger alert-info alert-primary")
              .addClass("alert-success")
              .text("Download Complete!");
        } else {
          $("#downloadAlert")
              .removeClass("alert-success alert-info alert-primary")
              .addClass("alert-danger")
              .text("Could not save file.  Check the file name and folder, and try again.")
        }
    });
}

function graphMeasurements() {
  $("#chartContainer").empty();
  if(measurements.length > 0) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = $("#chartContainer").width() - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#chartContainer")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
      .domain(d3.extent(measurements, function(d) { return d.dtm; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
        .ticks(3));
    
    // Add Y axis
    var y = d3.scaleLinear()
      .domain(d3.extent(measurements, function(d) {return d.Value; }))
      //domain([0, d3.max(measurements, function(d) { return +d.Value; })])
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
        .x(function(d) { return x(d.dtm) })
        .y(function(d) { return y(d.Value) })
        )
  }
}

function updateDates() {
    var startdtm = new Date($("#startDate").val());
    var enddtm   = new Date($("#endDate").val());
    
    $("#downloadStartDate").val($("#startDate").val());
    $("#downloadEndDate").val($("#endDate").val());
    
    loadMeasurements(
        sitecurrent, 
        paramcurrent, 
        methodcurrent,
        startdtm,
        enddtm, 
        alqwuutils.utcoffset*-1
    );
}
