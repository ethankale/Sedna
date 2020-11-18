
// CSS imports first (https://getbootstrap.com/docs/4.4/getting-started/webpack/)
import 'bootstrap/dist/css/bootstrap.min.css';
import "vue-select/dist/vue-select.css";
import 'flatpickr/dist/flatpickr.css';

// Then JS imports
let lx         = require('luxon');
let Papa       = require('papaparse');
let alqwuutils = require('./utils.js');
let Vue        = require('vue');
// let dataload   = require('./dataload.js');
let d3         = require('d3');
let legend     = require('d3-svg-legend');

import vSelect           from "vue-select";
import flatPickr         from "vue-flatpickr-component";
import DataLoad          from "./data-load.vue";
import DataMetadataModal from './data-metadata-modal.vue';

let $          = require('jquery');
let bootstrap  = require('bootstrap');

let _          = require('lodash');

// Now JS variables, which ought to be in Vue
let paramMarkup   = "";

let wycurrent    = 0;
let wymarkup     = "";

// This directive makes Vue work with Bootstrap's tooltip functionality
Vue.directive('tooltip', function(el, binding){
  $(el).tooltip({
    title: binding.value,
    placement: binding.arg,
    trigger: 'hover'
  });
});

var vm = new Vue({
  el: '#everythingContainer',
  
  components: {
    'data-metadata-modal': DataMetadataModal,
    'data-load':           DataLoad,
    'v-select':            vSelect,
    'flatPickr':           flatPickr
  },
  
  data: {
    samplePoints:  [],
    workups:       [],
    dailySummary:  [],
    
    graphTypes:    [],
    chartType:     "",
    
    hideInactive:  true,
    
    measurements:  [],
    params:        [],
    
    paramcurrent:  null,
    methodcurrent: null,
    unitcurrent:   null,
    
    waterYears:    [],
    paramDetails:  [],
    methodDetails: [],
    
    spID:          null,
    waterYear:     null,
    wylist:        [],
    
    utcHours:      alqwuutils.utcoffset,
    
    downloadStartDateString: lx.DateTime.fromJSDate(new Date()).toISODate(),
    downloadEndDateString:   lx.DateTime.fromJSDate(new Date()).minus({'days': 30}).toISODate()
  },
  
  watch: {
    spID: function(val) {
      this.changeSamplePoint();
    },
    
    waterYear: function(wy) {
      
      if (this.waterYear != undefined) {
        var firstdtm  = new Date(`${wy-1}-10-01T00:00:00`);
        var lastdtm   = new Date(`${wy}-09-30T00:00:00`);
        
        this.downloadStartDateString = lx.DateTime.fromJSDate(firstdtm).toISODate();
        this.downloadEndDateString   = lx.DateTime.fromJSDate(lastdtm).toISODate();
      };
      
      this.updateDates();
    },
    
  },
  
  computed: {
    
    disableReport: function() {
      return this.spID === null || 
      this.waterYears.length !== 1 || 
      this.waterYear === undefined
    },
    
    // siteID: function() {
      // let siteid = null;
      // if (this.samplePoints.length > 0) {
        // siteid = this.samplePoints.filter((sp) => {return sp.SamplePointID == this.spID})[0].SiteID;
      // };
      // return siteid;
    // },
    
    config: function() {
      return window.getConfig();
    },
    
    // Assumes dailySummary data are in order, oldest to newest
    dailyFormatted: function() {
      this.waterYears = [];
      
      let daily = [];
      let dtOld = lx.DateTime
        .fromISO(this.dailySummary[0].CollectedDate)
        .minus({ days:1 })
        .setZone('UTC');
      
      this.dailySummary.forEach((d,i,arr) => {
        let dt          = lx.DateTime.fromISO(d.CollectedDate).setZone('UTC');
        let diff        = dt.diff(dtOld, 'days').days;
        
        if (diff === 1) {
          let d_new   = {...d};
          dtOld       = dt.plus({'minutes':0});
          
          d_new.year  = dt.year;
          d_new.month = dt.month;
          d_new.day   = dt.day;
          d_new.wy    = d_new.month < 10 ? d_new.year : d_new.year+1;
          d_new.dtm   = dt.toJSDate();
          
          if (this.waterYears.findIndex(wy => wy === d_new.wy) === -1) {
            this.waterYears.push(d_new.wy);
          };
          
          daily.push(d_new);
        } else {
          while (diff >= 1) {
            let d_new      = {...d};
            let dtCurrent  = dtOld.plus({'days':1});
            
            d_new.year     = dtCurrent.year;
            d_new.month    = dtCurrent.month;
            d_new.day      = dtCurrent.day;
            d_new.wy       = d_new.month < 10 ? d_new.year : d_new.year+1;
            d_new.dtm      = dtCurrent.toJSDate();
            d_new.Value    = diff == 1 ? d_new.Value : null;
            d_new.ValueMax = diff == 1 ? d_new.ValueMax : null;
            d_new.ValueMin = diff == 1 ? d_new.ValueMin : null;
            d_new.ValueSum = diff == 1 ? d_new.ValueSum : null;
            
            if (this.waterYears.findIndex(wy => wy === d_new.wy) === -1) {
              this.waterYears.push(d_new.wy);
            };
            
            dtOld = dtCurrent.plus({'minutes':0});
            daily.push(d_new);
            diff -= 1;
          };
        };
      });
      return daily;
    },
    
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
    
    downloadStartDate: function() {
      return lx.DateTime
        .fromJSDate(new Date(this.downloadStartDateString + this.utcstring))
        .setZone(this.utcstring);
    },
    
    downloadEndDate: function() {
      return lx.DateTime
        .fromJSDate(new Date(this.downloadEndDateString + this.utcstring))
        .setZone(this.utcstring);
    },
  },
  
  methods: {
    clickCreateReport() {
      // To modify this to create one page per water year, we'll have to:
      //   1: save the list of water years and the start & end dates locally
      //   2: loop through the saved list of water years
      //   3: for each loop, set the startdatestring and enddate string 
      //   4: download the data for the water year
      //   5: update the graph
      //   6: save the title, subtitle, data, and graph to an Array
      //   7: complete for loop
      //   8: reset the start and end dates to their original values, download & graph data
      
      // Really not sure I want to do this yet.  Maybe just disable the report if there's more
      //   than one wy present.
      
      this.graphMeasurements(1000);
        
        let table    = this.dailyFormatted;
        let siteName = _.filter(this.samplePoints, ['SamplePointID', this.spID])[0]['Name']
        let subtitle = this.paramDetails.Name + " | " + this.waterYear;
        let svg      = $("#chartContainer svg")[0];
        
        window.makePDF(siteName, subtitle, table, svg);
        this.graphMeasurements();
    },
    
    clickParameter(clickedParam, e) {
      
      this.params.forEach(d => {
        d.active = false;
      });
      
      clickedParam.active = true;
      
      var lastdtm   = clickedParam.maxdtm;
      var wateryear = alqwuutils.calcWaterYear(lastdtm);
      var firstdtm  = clickedParam.mindtm;
      
      // Chart type 1 is the line & range chart; chart type 2 is the bar graph (precip).
      if ( (clickedParam.GraphTypeID == 1 | clickedParam.GraphTypeID == 2) & clickedParam.nmeasure > 1000) {
        firstdtm = new Date(`${wateryear-1}-10-01T00:00:00`);
      };
      
      this.downloadStartDateString = lx.DateTime.fromJSDate(firstdtm).toISODate();
      this.downloadEndDateString   = lx.DateTime.fromJSDate(lastdtm).toISODate();
      
      this.paramcurrent  = clickedParam.ParameterID;
      this.methodcurrent = clickedParam.MethodID;
      this.unitcurrent   = clickedParam.Unit;
      
      let waterYearList = alqwuutils.createWYList(clickedParam.mindtm, lastdtm);
      this.wylist = waterYearList;
      this.waterYear = waterYearList[waterYearList-1];
      
      console.log(waterYearList);
      console.log(this.waterYear);
      
      this.updateDates();
    },
    
    changeSamplePoint() {
      $("#chartContainer").empty();
      this.getWorkups();
      loadParamList();
    },
    
    getGraphTypes() {
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/graphTypeList`,
        method: 'GET',
        timeout: 3000,
        dataType: 'json',
        contentType: 'application/json'
      });
      return request;
    },
    
    getDailyMeasurements() {
      let query = {
        spID:      this.spID,
        paramid:   this.paramcurrent,
        methodid:  this.methodcurrent,
        startdate: this.downloadStartDateString,
        enddate:   this.downloadEndDateString
      };
      
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/getMeasurementsDaily`,
        method:'GET',
        timeout: 3000,
        data: query,
        dataType: 'json',
        contentType: 'application/json'
      });
      return request;
    },
    
    getParameterDetails() {
      let query = {
        ParameterID: this.paramcurrent
      };
      
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/parameter`,
        method:'GET',
        timeout: 3000,
        data: query,
        dataType: 'json',
        contentType: 'application/json'
      });
      return request;
    },
    
    getMethodDetails() {
      let query = {
        MethodID: this.methodcurrent
      };
      
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/method`,
        method:'GET',
        timeout: 3000,
        data: query,
        dataType: 'json',
        contentType: 'application/json'
      });
      return request;
    },
    
    onPageLoad() {
      this.getSamplePoints()
        .done((data) => {
          this.samplePoints = data;
        })
        .fail((err) => {
          console.log("Couldn't load sample points.");
          console.log(err);
        });
        
      this.getGraphTypes()
        .done((data) => {
          this.graphTypes = data;
        })
        .fail((err) => {
          console.log("Couldn't load graph types.");
          console.log(err);
        });
    },
    
    getSamplePoints() {
      let query = this.hideInactive ? { active: 1 } : null;
      let request = $.ajax({
        url:         `http://localhost:3000/api/v1/samplePointList`,
        method:      'GET',
        timeout:     3000,
        dataType:    'json',
        data:        query,
        contentType: 'application/json'
      });
      return request;
    },
    
    getWorkups() {
      console.log("getWorkups");
      let query = {
        spID: this.spID,
      };
      let request = $.ajax({
        url: `http://localhost:3000/api/v1/metadataBySamplePt`,
        method:'GET',
        timeout: 3000,
        data: query,
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        let wu = data;
        wu.forEach((w) => {
          w.DataStarts = lx.DateTime.fromISO(w.DataStarts);
          w.DataEnds   = lx.DateTime.fromISO(w.DataEnds);
          w.LoadedOn   = lx.DateTime.fromISO(w.CreatedOn);
        })
        this.workups = wu;
      })
    },
    
    graphMeasurements(width) {
      
      // Different charts for different parameters; hardcoded into the DB right now
      if (this.methodDetails.GraphTypeID === 1) {
        this.chartType = 'lineRange';
      } else if (this.methodDetails.GraphTypeID === 2) {
        this.chartType = 'bar';
      } else if (this.methodDetails.GraphTypeID === 3) {
        this.chartType = 'point';
      } else if (this.methodDetails.GraphTypeID === 4) {
        this.chartType = 'polar';
      };
      
      // Create columns for just provisional values
      this.dailyFormatted.forEach(d => {
        d.ValueProvisional    = d.Provisional == 1 ? d.Value    : null;
        d.ValueProvisionalMin = d.Provisional == 1 ? d.ValueMin : null;
        d.ValueProvisionalMax = d.Provisional == 1 ? d.ValueMax : null;
      });
      
      $("#chartContainer").empty();
      if(vm.dailyFormatted.length > 0) {
        let margin = {top: 10, right: 30, bottom: 30, left: 60},
            height = 400 - margin.top - margin.bottom;
        width = width || $("#chartContainer").width() - margin.left - margin.right;
        
        // append the svg object to the body of the page
        let svg = d3.select("#chartContainer")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        // Create the scale functions
        // x scale
        let x = d3.scaleTime()
          .domain(d3.extent(this.dailyFormatted, function(d) { return d.dtm; }))
          .range([ 0, width ]);
        
        // y scales
        let yExtent = null;
        if (this.chartType === 'lineRange') {
          yExtent = d3.extent( 
            [].concat(
              d3.extent(vm.dailyFormatted, function(d) {return d.ValueMax; }),
              d3.extent(vm.dailyFormatted, function(d) {return d.ValueMin; })),
            function(d) {return d});
        } else if (this.chartType === 'bar') {
          yExtent = [0, d3.max(vm.dailyFormatted, function(d) {return d.ValueSum; })];
        } else if (this.chartType === 'polar') {
          yExtent = [0, 360];
        } else {
          yExtent = d3.extent(vm.dailyFormatted, function(d) {return d.Value; })
        }
        
        let y = d3.scaleLinear()
          .domain(yExtent)
          .range([ height, 0 ]);
        
        // color scale (just provisional vs. non-provisional)
        let ordinal = d3.scaleOrdinal()
          .domain(["Non-Provisional", "Provisional"])
          .range(["steelblue", "firebrick"]);
        
        // Creating the charts, starting with line + range polygon
        if (this.chartType === 'lineRange') {
          let area = d3.area()
            .defined(d => { return d.ValueMin!=null & d.ValueMax!=null; })
            .x(d => x(d.dtm))
            .y0(d => y(d.ValueMin))
            .y1(d => y(d.ValueMax));
          
          let areaProvisional = d3.area()
            .defined(d => { return d.ValueProvisionalMin!=null & d.ValueProvisionalMax!=null; })
            .x(d => x(d.dtm))
            .y0(d => y(d.ValueProvisionalMin))
            .y1(d => y(d.ValueProvisionalMax));
          
          // Add the range polygon
          svg.append("path")
            .datum(vm.dailyFormatted)
            .attr("d", area)
            .attr("fill", "lightblue");
            
          svg.append("path")
            .datum(vm.dailyFormatted)
            .attr("d", areaProvisional)
            .attr("fill", "lemonchiffon");
            
          // Add the line (all data)
          svg.append("path")
          .datum(this.dailyFormatted)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
            .defined(d => { return d.Value!=null; })
            .x(d => { return x(d.dtm) })
            .y(d => { return y(d.Value) })
            )
          
          // Add the line (just the provisional data)
          svg.append("path")
          .datum(vm.dailyFormatted)
          .attr("fill", "none")
          .attr("stroke", "firebrick")
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
            .defined(d => { return d.ValueProvisional!=null; })
            .x(d => { return x(d.dtm) })
            .y(d => { return y(d.ValueProvisional) })
            )
        };
        
        if (this.chartType === 'bar') {
          svg.selectAll('plotBars')
            .data(this.dailyFormatted)
            .data(this.dailyFormatted.filter(d => d.Value != null))
            .enter()
            .append('rect')
              .attr('x', d => { return x(d.dtm); })
              .attr('y', d => { return y(d.ValueSum); })
              .attr('width', 1)
              .attr('height', d => { return height - y(d.ValueSum) })
              .attr('fill', d => { return d.Provisional == 1 ? "firebrick" : "steelblue"; })
        };
        
        if (this.chartType === 'point') {
          svg.append('g')
            .selectAll('dot')
            .data(this.dailyFormatted.filter(d => d.Value != null))
            .enter()
            .append('circle')
              .attr('cx', d => { return x(d.dtm) })
              .attr('cy', d => { return y(d.Value) })
              .attr('r', 3)
              .style('fill', d => { return d.Provisional == 1 ? "firebrick" : "steelblue"; })
        }
        
        if (this.chartType === 'polar') {
          svg.append('g')
            .selectAll('dot')
            .data(this.dailyFormatted.filter(d => d.ValueDegrees != null))
            .enter()
            .append('circle')
              .attr('cx', d => { return x(d.dtm) })
              .attr('cy', d => { return y(d.ValueDegrees) })
              .attr('r', 3)
              .style('fill', d => { return d.Provisional == 1 ? "firebrick" : "steelblue"; })
        }
        
        // Add the axes
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x)
            .ticks(3));
        
        svg.append("g")
          .call(d3.axisLeft(y));
        
        svg.append("text")
          .attr("x", 2)
          .attr("y", height-2)
          .text(this.unitcurrent);
          
        
        // Add the legend
        svg.append("g")
          .attr("class", "legendOrdinal")
          .attr("transform", "translate(20,20)");
        
        var legendOrdinal = legend.legendColor()
          .shape("path", d3.symbol().type(d3.symbolCircle).size(100)())
          .shapePadding(5)
          .scale(ordinal);
        
        svg.select(".legendOrdinal")
          .call(legendOrdinal);
      };
    },
    
    updateDates() {
      Promise.allSettled([
        this.getDailyMeasurements(), 
        this.getParameterDetails(),
        this.getMethodDetails()
      ]).then((data) => {
        this.dailySummary  = data[0].value;
        this.paramDetails  = data[1].value;
        this.methodDetails = data[2].value;
        
        this.graphMeasurements();
      })
      .catch(error => {
        console.log("Ran into an error getting daily measurements/parameter details");
        console.log(error);
      });
    }
  }
});

$(document).ready(function() {
    // $("#downloadParameterSelect").select2({ width: '100%' });
    $("#spSelect").select2({ 
      width:       '100%', 
      placeholder: 'Select a Sample Point'
    });
    
    vm.onPageLoad();
    
    $("#downloadDataButton").click(function() {
      var paramList = $("#downloadParameterSelect").val();
      var filename  = $("#downloadFileName").val();
      
      if (paramList.length > 0 && !isNaN(vm.downloadStartDate) &&
        !isNaN(vm.downloadEndDate) && filename.length > 0) {
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
            vm.spID, 
            paramids, 
            methodids
          );
      } else {
        $("#downloadAlert")
          .removeClass("alert-primary alert-info alert-success")
          .addClass("alert-danger")
          .text("Valid start date, end date, parameters, and file name are all required.");
      };
    });
    
    // These are the two date inputs - start and end date
    $("#date-select-row input").change(function() {
      vm.updateDates();
    });
    
});

function loadParamList() {
    let ajaxData = {
      spID: vm.spID
    };
    $.ajax({
      url:     'http://localhost:3000/api/v1/paramsBySamplePt',
      data:    ajaxData,
      method:  'GET',
      timeout: 3000
    }).done(function(data) {
        let dataSorted = _.orderBy(data, ['nmeasure', 'Name'], ['desc', 'asc']);
        
        vm.params = dataSorted;
        var downloadParamMarkup = "";
        
        vm.params.forEach(param => {
          param.maxdtm = new Date(param.maxdtm);
          param.mindtm = new Date(param.mindtm);
          param.active = false;
          
          downloadParamMarkup += `<option 
            value=${param.ParameterID}|${param.MethodID}>
            ${param.Name} (${param.Method})
            </option>`
            
        });
        
        $('#downloadParameterSelect').empty().append(downloadParamMarkup);
    });
};

function loadMeasurements(siteid, paramid, methodid, startdtm, enddtm, utcoffset) {
    let ajaxData = {
      spID:       vm.spID,
      paramid:    paramid,
      methodid:   methodid,
      startdtm:   startdtm,
      enddtm:     enddtm,
      utcoffset:  utcoffset
    };
    
    $.ajax({
      url:  'http://localhost:3000/api/v1/getMeasurements',
      data: ajaxData,
      method:  'GET',
      timeout: 3000
    }).done(function(data) {
        vm.measurements = data;
        vm.measurements.forEach(function(d) {
            d.dtm = Date.parse(d.CollectedDateTime);
        });
        vm.graphMeasurements();
    });
};

function downloadMeasurements(spID, paramids, methodids, startdtm, enddtm) {
    var dateoptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    
    var paramidsString  = "";
    var methodidsString = "";
    
    paramids.forEach(paramid   => { paramidsString  += "&paramids=" + paramid })
    methodids.forEach(methodid => { methodidsString += "&methodids=" + methodid })
    
    
    var url = 'http://localhost:3000/api/v1/getMeasurementDetails' +
        '?spID='        + spID +
        paramidsString  +
        methodidsString +
        '&startdtm='    + vm.downloadStartDate.toISO() +
        '&enddtm='      + vm.downloadEndDate.plus({days: 1}).toISO();
    
    $.ajax({url: url
    }).done(function(data) {
        vm.measurements = data;
        vm.measurements.forEach(function(d) {
          // This is super ugly, but javascript insists on treating every date like it's UTC, 
          //   and I specifically want all the dates in the front end to be local, 
          //   with UTC on the back end.
          d.CollectedDateTime = d.CollectedDateTime.replace("T", " ").replace("Z", " ").trim();
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
};
