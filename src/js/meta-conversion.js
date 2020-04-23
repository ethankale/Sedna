
let Vue = require('vue');
let d3  = require('d3');

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

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-conversion',
  data: {
    ConversionID: null,
    conversions: [],
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: `Click 'Edit' below to make changes, or 'New' to create a new Conversion.`,
    line: '',
    svgWidth: 0,
    //svgHeight: 300,
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
    }
  },
  
  computed: {
    editButtonText: function() {
      return this.locked ? 'Edit' : 'Save';
    },
    
    newButtonText: function() {
      return this.creatingNew ? 'Save' : 'New';
    },
    
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
      ConversionID = typeof ConversionID == 'undefined' ? conversions[0].ConversionID : ConversionID;
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/conversion?ConversionID=${ConversionID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentConversion = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = `Click 'Edit' below to make changes, or 'New' to create a new Conversion.`;
        
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
        this.dirty  = false;
        this.error  = false;
        this.locked = false;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Conversion.  Please double-check the values.";
      });
    },
    
    newConversionClick: function() {
      if (this.creatingNew) {
        this.saveNewConversion();
      } else {
        this.editNewConversion();
      };
    },
    
    editNewConversion: function() {
      for (const prop in this.currentConversion) {
        this.currentConversion[prop] = null;
      };
      this.currentConversion.Active = true;
      this.currentConversion.ConversionValues = [];
      this.creatingNew = true;
      this.locked = false;
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
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = false;
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the Conversion.  Please double-check the values.";
      });
    },
    
    cancelConversion: function() {
      this.getCurrentConversion(this.ConversionID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditConversion: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateConversion();
      }
    },
    
    calculatePath() {
      // const scale = this.getScales();
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
    }
  }
})

