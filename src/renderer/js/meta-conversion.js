
let Vue        = require('vue')
let $          = require('jquery');
let select2    = require('select2');
let d3         = require('d3');
var Papa       = require('papaparse');

import NewEditCancel from './new-edit-cancel.vue';

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#conversionSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-conversion',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    ConversionID: null,
    conversions: [],
    
    editstate: 'view',
    error:     false,
    
    notificationText: `Click 'Edit' below to make changes, or 'New' to create a new Conversion.`,
    line: '',
    svgWidth: 0,
    margin: {
      top: 10, 
      right: 30, 
      bottom: 30, 
      left: 40
    },
    xaxis: '',
    yaxis: '',
    currentConversion: {
      ConversionID:     null,
      ConversionName:   null,
      CreatedBy:        null,
      LastModified:     null,
      Description:      null,
      Active:           null,
      ConversionValues: []
    },
  },
  
  watch: {
    ConversionID: function() {
      this.setSVGWidth();
    },
    
    CVs: function() {
      this.calculatePath();
    }
  },
  
  computed: {
    svgHeight: function() {
      return Math.floor(this.svgWidth / 1.6);
    },
    
    outsideWidth() {
      return this.svgWidth + this.margin.left + this.margin.right;
    },
    
    outsideHeight() {
      return this.svgHeight + this.margin.top + this.margin.bottom;
    },
    
    scale() {
      const x = d3
        .scaleLinear()
        .domain(d3.extent(this.currentConversion.ConversionValues, d => d.FromValue))
        .rangeRound([0, this.svgWidth]);
      const y = d3
        .scaleLinear()
        .domain(d3.extent(this.currentConversion.ConversionValues, d => d.ToValue))
        .rangeRound([this.svgHeight, 0]);
      return { x, y };
    },
    
    CVs() {
      return this.currentConversion.ConversionValues;
    }
  },
  
  directives: {
    axis(el, binding) {
      const axis = binding.arg;
      const axisMethod = { x: "axisBottom", y: "axisLeft" }[axis];
      const methodArg = binding.value[axis];
      
      d3.select(el).call(d3[axisMethod](methodArg));
    }
  },
  
  mounted: function () {
    this.updateConversionList();
    this.addResizeListener();
  },
  
  methods: {
    updateConversionList: function(ConversionID) {
      let active = $("#conversion-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/conversionList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.conversions = data;
        // Initial load
        if (typeof ConversionID === 'undefined') {
          this.getCurrentConversion(data[0].ConversionID);
          this.ConversionID = data[0].ConversionID;
        // Subsequent updates
        } else {
          this.ConversionID = ConversionID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentConversion: function(ConversionID) {
      ConversionID = typeof ConversionID == 'undefined' ? this.conversions[0].ConversionID : ConversionID;
      $.ajax({
        url: `http://localhost:3000/api/v1/conversion?ConversionID=${ConversionID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentConversion = data;
        this.editstate         = 'view';
        this.error             = false;
        this.notificationText  = `Click 'Edit' below to make changes, or 'New' to create a new Conversion.`;
        
        // The first time this loads svgWidth is 0, for reasons I can't figure out.
        //   But the resize handler works.  So trigger that (and the subsequent
        //   graphing function) if svgWidth is 0; otherwise, skip the resize event.
        
        this.calculatePath();
        
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Conversion.";
      }).always(() => {
        
      });
    },
    
    updateConversion: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/conversion`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentConversion),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.editstate = 'view';
        this.error     = false;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Conversion.  Please double-check the values.";
      });
    },
    
    clickNewConversion: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewConversion();
      } else {
        this.saveNewConversion();
      };
    },
    
    editNewConversion: function() {
      for (const prop in this.currentConversion) {
        this.currentConversion[prop] = null;
      };
      this.currentConversion.Active = true;
      this.currentConversion.ConversionValues = [];
      this.notificationText = "Fill in at least the site and name fields below.  'Save' to create new Conversion."
    },
    
    saveNewConversion: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/conversion`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentConversion),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Conversion!";
        this.ConversionID = data;
        this.updateConversionList(this.ConversionID);
        this.currentConversion.ConversionID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the Conversion.  Please double-check the values.";
      });
    },
    
    clickCancelConversion: function() {
      this.getCurrentConversion(this.ConversionID);
      
      this.editstatus = 'view';
      this.error       = false;
    },
    
    clickEditConversion: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateConversion();
      };
    },
    
    calculatePath() {
      const scale = this.scale;
      const path = d3.line()
        .x(d => scale.x(d.FromValue))
        .y(d => scale.y(d.ToValue));
      this.line = path(this.currentConversion.ConversionValues);
    },
    
    setSVGWidth() {
      if ($("#conversionChartContainer").width() > 0) {
        this.svgWidth = $("#conversionChartContainer").width() - this.margin.left - this.margin.right;
      } else {
        this.svgWidth = 500;
      };
    },
    
    addResizeListener() {
      window.addEventListener('resize', () => {
        this.setSVGWidth();
        this.calculatePath();
      });
    },
    
    openCVFileDialog() {
      let [filePath, fileText] = window.openCSV();
      // Sometimes users cancel out of the dialog
      if (fileText != '') {
        this.parseCVText(fileText);
      };
    },
    
    parseCVText(fileText) {
      let papaConfig = {
        delimiter: ',',
        quoteChar: '"',
        header: false, 
        skipEmptyLines: true
      };
      var fileData = Papa.parse(fileText, papaConfig);
      this.currentConversion.ConversionValues = [];
      //console.log(fileData.data[0]);
      fileData.data.forEach((d, i) => {
        let fromval = parseFloat(d[0]);
        let toval   = parseFloat(d[1]);
        if (!isNaN(toval) & !isNaN(fromval)) {
          this.currentConversion.ConversionValues.push({'FromValue': fromval, 'ToValue': toval});
        }
      });
    }
  }
})

