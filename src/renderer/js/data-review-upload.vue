<script>
let Papa       = require('papaparse');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let $          = require('jquery');
let _          = require('lodash');

import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

export default {
  components: {
    'v-select': vSelect
  },
  
  props: {
    fields: [],
    SamplePointID: 0,
    datetimeField: '',
    valueField: '',
    dataFromFile: {}
  },
  
  data: function() {
    return {
      Qualifier  : 'None',
      Depth_M:     'None',
      Duplicate:   'None',
      LabBatch:    'None',
      Symbol:      'None',
      Note:        'None',
      
      Metadatas:   [],
      metaIndex:   0,
      newMeta:     {
        Active:           true,
        CreatedOn:        null,
        DataEnds:         null,
        DataStarts:       null,
        DecimalPoints:    2,
        Description:      "",
        FileName:         null,
        FrequencyMinutes: 15,
        GraphTypeID:      null,
        LoadedOn:         null,
        MethodID:         null,
        Name:             "New",
        Notes:            null,
        ParameterID:      null,
        SamplePointID:    null,
        Symbol:           "",
        UnitID:           null,
        UserID:           null
      },
      
      metaToCreate:     {
        Active:           true,
        CreatedOn:        null,
        DataEnds:         null,
        DataStarts:       null,
        DecimalPoints:    2,
        Description:      "",
        FileName:         null,
        FrequencyMinutes: 15,
        GraphTypeID:      null,
        LoadedOn:         null,
        MethodID:         null,
        Name:             "New",
        Notes:            null,
        ParameterID:      null,
        SamplePointID:    null,
        Symbol:           "",
        UnitID:           null,
        UserID:           null
      },
      
      parameters: [],
      methods:    [],
      units:      [],
      qualifiers: [],
      
      offset:     0,
      drift:      0,
      
      screen:      "fieldSelect"
    }
  },
  
  computed: {
    fieldsForSelect: function() {
      return ["None"].concat(this.fields);
    },
    
    metasPlusOne: function() {
      let mp1 = [this.newMeta].concat(this.Metadatas);
      
      mp1.forEach(m => {
        m.label = m.Name + ' (' + m.Symbol.trim() + ') ' + m.Description;
      });
      
      return mp1;
    },
    
    dataToLoad: function() {
      let dtl = _.cloneDeep(this.dataFromFile);
      
      // Timezone stuff
      let utcHours       = alqwuutils.utcoffset;
      let utcOffset      = Math.floor(utcHours*60);
      let utcHoursString = utcHours < 0 ? utcHours.toString() : "+" + utcHours.toString();
      let utcString      = alqwuutils.utcOffsetString(utcOffset);
      
      // Setup for offset and drift, if necessary
      // Works like this - the stepchange is the increment that the data change for
      //   every timestep.  Calculate that first, using the first & last values
      //   of the dataset.  Then the drift- and offset-compensated value is the 
      //   original value, plus the stepchange times the number of steps, plus the offset.
      // This assumes there are no gaps in the data.  It will be wrong if there are gaps.
      let stepchange = 0;
      
      let firstdate = lx.DateTime
        .fromJSDate(new Date(dtl[0][this.datetimeField] + utcHoursString))
          .setZone(utcString);
      let lastdate  = lx.DateTime
        .fromJSDate(new Date(dtl[dtl.length-1][this.datetimeField] + utcHoursString))
          .setZone(utcString);
      
      if (this.metaToCreate.FrequencyMinutes != null) {
        let differenceInMinutes = lastdate.diff(firstdate, 'minutes').as('minutes');
        let totalTimesteps      = (differenceInMinutes/this.metaToCreate.FrequencyMinutes)+1;
        let missingTimesteps    = totalTimesteps - dtl.length;

        stepchange = this.drift/(totalTimesteps-1);
      };
      
      
      let n = 0;
      dtl.forEach((d) => {
        d.CollectedDTM = lx.DateTime
          .fromJSDate(new Date(d[this.datetimeField] + utcHoursString))
          .setZone(utcString);
        
        d.Depth_M    = this.Depth_M == 'None'   ? null : d[this.Depth_M];
        d.Duplicate  = this.Duplicate == 'None' ? null : d[this.Duplicate];
        d.LabBatch   = this.LabBatch == 'None'  ? null : d[this.LabBatch];
        d.Note       = this.Note == 'None'      ? null : d[this.Note];
        d.Symbol     = this.Symbol == 'None'    ? null : d[this.Symbol];
        d.Qualifier  = this.Qualifier == 'None' ? null : _.find(this.qualifiers, ['Code', d[this.Qualifier].trim()]).QualifierID;
        
        d.ValueOriginal = +d[this.valueField];
        
        // Calculate drift and offset, if applicable
        if (stepchange != 0 | this.offset != 0) {
          d.Value = this.roundToDecimal((d.ValueOriginal + ((stepchange*n) + this.offset)), this.metaToCreate.DecimalPoints);
          //d.Value = this.roundToDecimal(d.ValueOriginal + (stepchange*n) + this.offset, 2);
        } else {
          d.Value = d.ValueOriginal;
        };
        
        n += 1;
      });
      
      return dtl;
    },
    
  },
  
  methods: {
    getLatestMetas(spID) {
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataLatestBySamplePt?spID=${spID}`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    getParameterList() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/parameterList`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    getMethodList() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/methodList`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    getUnitList() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/unitList`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    getQualifierList() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/qualifierList`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    nextScreen() {
      if (this.screen == 'fieldSelect') {
        this.screen = 'metadataForm';
      } else if (this.screen == 'metadataForm') {
        this.screen = 'adjustAndReview';
      }
    },
    
    lastScreen() {
      if (this.screen == 'metadataForm') {
        this.screen = 'fieldSelect';
      } else if (this.screen == 'adjustAndReview') {
        this.screen = 'metadataForm';
      }
    },
    
    fillMetaForm(metadata) {
      
      let interimMeta = _.cloneDeep(metadata);
      
      this.metaToCreate = interimMeta;
    },
    
    graphData() {
      
      $("#graph").empty();
      let margin = {top: 10, right: 60, bottom: 30, left: 60},
          width = $("#graph").width() - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;
      // append the svg object to the body of the page
      let svg = d3.select(selector)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      //Read the data
      // Add X axis --> it is a date format
      let x = d3.scaleTime()
        .domain(d3.extent(dataToLoad, function(d) { return new Date(d.CollectedDTM); }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
          .ticks(3));

      let valueExtent  = d3.extent(dataToLoad, function(d) {return d.ValueOriginal; });
      let filledExtent = d3.extent(dataToLoad, function(d) {return d.Value; });

      let yextent = [d3.min(valueExtent.concat(filledExtent)), d3.max(valueExtent.concat(filledExtent))]

      // Add Y axis
      let y = d3.scaleLinear()
        .domain(yextent)
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add the line for filled & adjusted data
      svg.append("path")
        .datum(dataToLoad)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2.5)
        .attr("d", d3.line()
          .defined(d => !isNaN(d.Value))
          .x(function(d) { return x(new Date(d.CollectedDTM)) })
          .y(function(d) { return y(d.Value) })
          );

      // Add the line for original data
      svg.append("path")
        .datum(dataToLoad)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .defined(d => !isNaN(d.ValueOriginal))
          .x(function(d) { return x(new Date(d.CollectedDTM)) })
          .y(function(d) { return y(d.ValueOriginal) })
          );
    },
    
    roundToDecimal(number, decimal) {
      return Math.round(number*Math.pow(10, decimal))/Math.pow(10, decimal);
    }
    
  },
  
  created() {
    this.getLatestMetas(this.SamplePointID).done((metas) => {
      this.Metadatas = metas;
    });
    
    this.getParameterList().done((params) => {
      this.parameters = params;
    });
    
    this.getMethodList().done((methods) => {
      this.methods = methods;
    });
    
    this.getUnitList().done((units) => {
      this.units = units;
    });
    
    this.getQualifierList().done((quals) => {
      this.qualifiers = quals;
    });
  }
  
}
</script>

<template>
  <div>
    <br>
    <div class="row">
    
      <div class="col-1">
        <button 
          id="backScreenButton" 
          type="button" 
          class="btn btn-light"
          @click="lastScreen()"
          :disabled="screen == 'fieldSelect'"
        >&lt;</button>
      </div>
      
      <div class="col-10"
        v-if="screen == 'fieldSelect'">
        <h5 class="text-center">Additional Fields</h5>
      </div>
      
      <div class="col-10"
        v-if="screen == 'metadataForm'">
        <h5 class="text-center">Metadata</h5>
      </div>
      
      <div class="col-10"
        v-if="screen == 'adjustAndReview'">
        <h5 class="text-center">Adjust and Review</h5>
      </div>
      
      <div class="col-1">
        <button 
          id="backScreenButton" 
          type="button" 
          class="btn btn-light float-right"
          @click="nextScreen()"
        >&gt;</button>
      </div>
    </div>
    
    <div id="fieldSelect"
      v-if="screen == 'fieldSelect'">
      <br>
      <p>Pick the columns from the CSV that match the fields in GData.  If a GData field doesn't have
         a matching column, leave it as "None".</p>
      <table class="table">
        <thead>
          <tr>
            <th scope="col">GData Field</th>
            <th scope="col">CSV Field</th>
          </tr>
        </thead>
        
        <tbody>
          <tr> 
            <td>Qualifier</td>
            <td>
              <v-select 
                v-model="Qualifier"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
          <tr>
            <td>Depth (meters)</td>
            <td>
              <v-select 
                v-model="Depth_M"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
          <tr>
            <td>Duplicate</td>
            <td>
              <v-select 
                v-model="Duplicate"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
          <tr>
            <td>Lab Batch</td>
            <td>
              <v-select 
                v-model="LabBatch"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
          <tr>
            <td>Symbol</td>
            <td>
              <v-select 
                v-model="Symbol"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
          <tr>
            <td>Note</td> 
            <td>
              <v-select 
                v-model="Note"
                :options="fieldsForSelect">
              </v-select>
            </td>
          </tr>
        </tbody>
        
      </table>
    </div>
    
    <div id="metadataForm"
      v-if="screen == 'metadataForm'">
      <br>
      <p>These are fields that are the same for every record in this file.  You can pick an existing
        metadata record to fill this form in faster.</p>
      
      <v-select
        class="bg-light"
        label="label"
        :options="metasPlusOne"
        @input="metadata => fillMetaForm(metadata)">
      </v-select>
      
      <hr>
      
      <form>
        <div class="row">
          <div class="form-group col-12">
            <small><label for="parameter">Parameter</label></small>
            <v-select
              id="parameter"
              v-model="metaToCreate.ParameterID"
              :options="parameters"
              label="Name"
              :reduce="param => param.ParameterID">
            </v-select>
          </div>
        </div>
        
        <div class="row">
          <div class="form-group col-12">
            <small><label for="method">Method</label></small>
            <v-select
              id="method"
              v-model="metaToCreate.MethodID"
              :options="methods"
              label="Name"
              :reduce="method => method.MethodID">
            </v-select>
          </div>
        </div>
        
        <div class="row">
          <div class="form-group col-6">
            <small><label for="unit">Unit</label></small>
            <v-select
              id="unit"
              v-model="metaToCreate.UnitID"
              :options="units"
              label="Symbol"
              :reduce="unit => unit.UnitID">
            </v-select>
          </div>
        </div>
        
        <div class="row">
        
          <div class="form-group col-6">
            <small><label for="frequencyMinutes">Interval (minutes)</label></small>
            <input 
              id="frequencyMinutes"
              class="form-control"
              type="number"
              v-model.number="metaToCreate.FrequencyMinutes"></input>
          </div>
          
          <div class="form-group col-6">
            <small><label for="decimalPoints">Decimal Points</label></small>
            <input 
              id="decimalPoints"
              class="form-control"
              type="number"
              v-model.number="metaToCreate.DecimalPoints"></input>
          </div>
          
        </div>
        
        <div class="row">
          <div class="form-group col-12">
            <small><label for="notes">Notes</label></small>
            <textarea 
              id="notes"
              class="form-control"
              rows="3"
              v-model="metaToCreate.Notes"></textarea>
          </div>
        </div>
        
      </form>
      
    </div>
    
    <div id="adjustAndReview"
      v-if="screen == 'adjustAndReview'">
      <br>
      <p>Set an offset and drift, if applicable.  Review dates/times, values, and other columns
        before moving to the upload screen</p>
        
      <div class="row">
        <div id="graph" class="col-12">
        
        </div>
      </div>
        
    </div>
    
    <br>
    
  </div>
</template>