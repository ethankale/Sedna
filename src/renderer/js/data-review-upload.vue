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
      
      let utcHours       = alqwuutils.utcoffset;
      let utcOffset      = Math.floor(utcHours*60);
      let utcHoursString = utcHours < 0 ? utcHours.toString() : "+" + utcHours.toString();
      let utcString      = alqwuutils.utcOffsetString(utcOffset);
      
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
      }
    },
    
    lastScreen() {
      if (this.screen == 'metadataForm') {
        this.screen = 'fieldSelect';
      }
    },
    
    fillMetaForm(metadata) {
      
      let interimMeta = _.cloneDeep(metadata);
      
      this.metaToCreate = interimMeta;
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
        label="label"
        :options="metasPlusOne"
        @input="metadata => fillMetaForm(metadata)">
      </v-select>
      
      <form>
        <div class="row">
          <div class="form-group col-6">
            <small><label for="frequencyMinutes">Interval (minutes)</label></small>
            <input 
              id="frequencyMinutes"
              type="number"
              v-model="metaToCreate.FrequencyMinutes"></input>
          </div>
        </div>
      </form>
      
    </div>
    
    <br>
    
  </div>
</template>