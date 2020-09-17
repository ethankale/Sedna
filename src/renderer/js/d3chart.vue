<script>
import _ from 'lodash'
import * as d3 from 'd3'
import * as lx from 'luxon'

export default {
  name: 'd3chart',
  props: {
    dataToLoad: Array,
    width:      Number,
    height:     Number
  },
  
  data() {
    return {
      margin: {
        top:     10,
        right:   0,
        bottom: 30,
        left:   80
      }
    }
  },
  
  watch: {
    dataToLoad: function() {
      this.renderAxes();
    }
  },
  
  mounted() {
    this.renderAxes();
  },
  
  computed: {
    
    x_extent: function() {
      return d3.extent(this.dataToLoad, function(d) { return new Date(d.CollectedDTM.toISO()); });
    },
    
    y_extent: function() {
      let valueExtent  = d3.extent(this.dataToLoad, function(d) {return d.ValueOriginal; });
      let filledExtent = d3.extent(this.dataToLoad, function(d) {return d.Value; });
      
      return [d3.min(valueExtent.concat(filledExtent)), 
              d3.max(valueExtent.concat(filledExtent))];
    },
    
    x_scale: function() {
      return d3.scaleTime()
        .domain(this.x_extent)
        .range([ this.margin.left, this.width - this.margin.right ]);
    },
    
    y_scale: function() {
      return d3.scaleLinear()
        .domain(this.y_extent)
        .range([ this.height - this.margin.bottom, this.margin.top ]);
    },
    
    lineOriginal: function() {
      let path =  d3.line()
        .defined(d => !isNaN(d.ValueOriginal))
        .x(d => this.x(new Date(d.CollectedDTM.toISO())) )
        .y(d => this.y(d.ValueOriginal) );
        
      return path(this.dataToLoad);
    },
    
    lineAdjusted: function() {
      let path = d3.line()
        .defined(d => !isNaN(d.Value))
        .x(d => this.x(new Date(d.CollectedDTM.toISO())) )
        .y(d => this.y(d.Value) );
        
      return path(this.dataToLoad);
    },
  },
  
  methods: {
    x: function(d) {
      return this.x_scale(d);
    },
    
    y: function(d) {
      return this.y_scale(d);
    },
  
    renderAxes: function() {
      const xAxis = d3.axisBottom(this.x_scale).ticks(4);
      const yAxis = d3.axisLeft(this.y_scale).ticks(4);
      
      d3.select(this.$refs.xAxis).call(xAxis);
      d3.select(this.$refs.yAxis).call(yAxis);
      
    },
  }
  
}

</script>

<template>
  <div class="d3chart">
    <svg :width='width' :height='height'>
      <g class='d3chart' style="`transform: translate(0, ${margin.bottom})`">
        <path 
          :d="lineAdjusted"
          fill="none"
          stroke="orange"
          stroke-width="2.5" />
        <path 
          :d="lineOriginal"
          fill="none"
          stroke="steelblue"
          stroke-width="1.5"/>
      </g>
      
      <g ref="xAxis" :transform="`translate(0, ${height-margin.bottom})`"/>
      <g ref="yAxis" :transform="`translate(${margin.left}, 0)`"/>
    </svg>
  </div>
</template>