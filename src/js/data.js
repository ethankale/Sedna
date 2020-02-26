
var sites        = [];
var sitesMarkup  = "";

var params       = [];
var paramMarkup  = "";

var measurements = []

$(document).ready(function() {
    loadSites();
    $("#siteSelect").change(function() {
        measurements = [];
        $("#chartContainer").empty();
        loadParamList($("#siteSelect").val());
    });
});


function loadSites() {
    $.ajax({url: "http://localhost:3000/api/v1/getSites"
    }).done(function(data) {
        sites = data;
        sites.forEach(site => sitesMarkup = sitesMarkup + '<option value="' + 
            site.SiteID + '">' + 
            site.Code + ': ' + site.Name + '</option>\n');
        $('#siteSelect').empty().append(sitesMarkup);
        $("#siteSelect").change();
    });
}

function loadParamList(siteid) {
    $.ajax({url: `http://localhost:3000/api/v1/getParamsBySite?siteid=${siteid}`
    }).done(function(data) {
        params = data;
        paramMarkup = "";
        params.forEach(param => paramMarkup = paramMarkup + `<button data-paramid=${param.ParameterID} type="button" class="list-group-item list-group-item-action">${param.Name}</button>\n`);
        paramMarkup = '<div class="list-group list-group-flush">' + paramMarkup + "</div>";
        $('#paramList').empty().append(paramMarkup);
        $("#paramList div button").click(function() {loadMeasurements(siteid, $(this).data("paramid"),'2020-01-01','2020-02-01')});
        $("#paramList div button:first").click();
    });
}

function loadMeasurements(siteid, paramid, startdtm, enddtm) {
    $.ajax({url: `http://localhost:3000/api/v1/getMeasurements?siteid=${siteid}&paramid=${paramid}&startdtm=${startdtm}&enddtm=${enddtm}`
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
      .call(d3.axisBottom(x));
    
    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(measurements, function(d) { return +d.Value; })])
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
