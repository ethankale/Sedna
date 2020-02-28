
// Node modules.  Remember to run browserify every time to bundle this.
// browserify src/js/data.js -o src/js/data_bundle.js



var datefns    = require('date-fns');   // Bringing in everything for now; can lighten up in the future.
var alqwuutils = require('./utils.js');

var sites        = [];
var sitecurrent  = 0;
var sitesMarkup  = "";

var params       = [];
var paramcurrent = 0;
var paramMarkup  = "";

var wylist       = [];
var wycurrent    = 0;
var wymarkup     = "";

var measurements = []

$(document).ready(function() {
    loadSites();
    $("#siteSelect").change(function() {
        measurements = [];
        sitecurrent = $("#siteSelect").val();
        $("#chartContainer").empty();
        loadParamList(sitecurrent);
    });
    // These are the two date inputs - start and end date
    $("#date-select-row input").change(function() {
        var startdtm = new Date($("#startDate").val());
        var enddtm   = new Date($("#endDate").val());
        loadMeasurements(
            sitecurrent, 
            paramcurrent, 
            startdtm,
            enddtm, 
            alqwuutils.utcoffset
        );
    });
    $("#wylist").change(function() {
        wycurrent = $("#wylist").val();
        var firstdtm  = new Date(`${wycurrent-1}-10-01T00:00:00`);
        var lastdtm   = new Date(`${wycurrent}-09-30T00:00:00`);
        
        $("#startDate").val(datefns.format(firstdtm, 'yyyy-MM-dd'));
        $("#endDate").val(datefns.format(lastdtm, 'yyyy-MM-dd'));
        
        loadMeasurements(sitecurrent, paramcurrent, firstdtm, lastdtm, alqwuutils.utcoffset)
    });
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
        //$("#siteSelect").change();
    });
}

function loadParamList(siteid) {
    $.ajax({url: `http://localhost:3000/api/v1/getParamsBySite?siteid=${siteid}`
    }).done(function(data) {
        params = data;
        paramMarkup = "";
        
        params.forEach(param => {
            param.maxdtm = new Date(param.maxdtm);
            param.mindtm = new Date(param.mindtm);
            paramMarkup = paramMarkup + `<button data-paramid=${param.ParameterID} 
            data-lastcollectdtm=${param.maxdtm.toLocaleDateString()}
            data-firstcollectdtm=${param.mindtm.toLocaleDateString()}
            type="button" class="list-group-item list-group-item-action">
            ${param.Name}
            </button>\n`;
        });
        paramMarkup = '<div class="list-group list-group-flush">' + paramMarkup + "</div>";
        $('#paramList').empty().append(paramMarkup);
        $("#paramList div button").click(function() {
            var lastdtm   = new Date($(this).data("lastcollectdtm"));
            var wateryear = alqwuutils.calcWaterYear(lastdtm);
            var firstdtm  = new Date(`${wateryear-1}-10-01T00:00:00`);
            
            $("#startDate").val(datefns.format(firstdtm, 'yyyy-MM-dd'));
            $("#endDate").val(datefns.format(lastdtm, 'yyyy-MM-dd'));
            
            paramcurrent = $(this).data("paramid");
            
            wymarkup = "";
            wylist = alqwuutils.createWYList(new Date($(this).data("firstcollectdtm")), lastdtm);
            wylist.forEach(wy => {
                wymarkup += `<option value=${wy}>${wy}</option>\n`
            });
            $('#wylist').empty().append(wymarkup).val(wylist[wylist.length-1]);
            //$('#wylist').val(wylist[wylist.length-1]);
            
            loadMeasurements(siteid, paramcurrent, firstdtm, lastdtm, alqwuutils.utcoffset)
        });
        $("#paramList div button:first").click();
    });
}

function loadMeasurements(siteid, paramid, startdtm, enddtm, utcoffset) {
    var dateoptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    
    var startdtmstring = startdtm.toLocaleDateString("en-US", dateoptions);
    var enddtmstring   = enddtm.toLocaleDateString("en-US", dateoptions);
    
    var url = 'http://localhost:3000/api/v1/getMeasurements' +
        '?siteid='    + siteid +
        '&paramid='   + paramid +
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

function graphMeasurements() {
  $("#chartContainer").empty();
  if(measurements.length > 0) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
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
