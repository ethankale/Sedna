<script>
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let $          = require('jquery');
let _          = require('lodash');

import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

import d3chart from "./d3chart.vue";

export default {
  components: {
    'v-select': vSelect,
    'd3chart':  d3chart
  },
  
  props: {
    fields:        Array,
    SamplePointId: Number,
    datetimeField: String,
    valueField:    String,
    dataFromFile:  Array,
    filePath:      String,
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
      // This is just a blank metadata record for the 
      //   list of metadata that the user can choose.
      //   It makes it easier to choose a blank screen 
      //   to make a new metadata record.
      newMeta:     {
        Active:            true,
        CreatedOn:         null,
        DataEnds:          null,
        DataStarts:        null,
        DecimalPoints:     2,
        Description:       "",
        FileName:          null,
        FrequencyMinutes:  15,
        GraphTypeID:       null,
        MethodID:          null,
        Name:              "New",
        Notes:             null,
        ParameterID:       null,
        SamplePointID:     null,
        Symbol:            "",
        UnitID:            null,
        UserID:            null,
        EquipmentIDSensor: null,
        EquipmentIDLogger: null
      },
      
      //  This is the metadata record that will be created on data load.
      metaToCreate:     {
        Active:            true,
        CreatedOn:         null,
        DataEnds:          null,
        DataStarts:        null,
        DecimalPoints:     2,
        Description:       "",
        FileName:          null,
        FrequencyMinutes:  15,
        GraphTypeID:       null,
        MethodID:          null,
        Name:              "New",
        Notes:             null,
        ParameterID:       null,
        SamplePointID:     null,
        Symbol:            "",
        UnitID:            null,
        UserID:            null,
        EquipmentIDSensor: null,
        EquipmentIDLogger: null,
        UTCOffset:         null
      },
      
      parameters: [],
      methods:    [],
      units:      [],
      qualifiers: [],
      equipment:  [],
      
      offset:     0,
      drift:      0,
      stepchange: 0,
      
      matchingDataRecords: [],
      
      uploadResult: {
        progress:  0,
        errors:    0,
        successes: 0,
        message:   "No data uploaded yet."
      },
      
      screen:         "fieldSelect"
    }
  },
  
  computed: {
    fieldsForSelect: function() {
      return ["None"].concat(this.fields);
    },
    
    matchingMeasuresCount: function() {
      let nmeasures = 0;
      
      // This is a little sneaky.  We update the original data 
      //    while computing the count.
      if (this.matchingDataRecords.length > 0) {
        this.matchingDataRecords.forEach((d) => {
          nmeasures += d.nmeasures;
          d.minDTString = lx.DateTime
            .fromISO(d.mindt, {zone: this.utcOffsetString})
            .toLocaleString(lx.DateTime.DATETIME_FULL);
          d.maxDTString = lx.DateTime
            .fromISO(d.maxdt, {zone: this.utcOffsetString})
            .toLocaleString(lx.DateTime.DATETIME_FULL);
        });
      };
      return nmeasures;
    },
    
    metasPlusOne: function() {
      let mp1 = [this.newMeta].concat(this.Metadatas);
      
      mp1.forEach(m => {
        m.label = m.Name + ' (' + m.Symbol.trim() + ') ' + m.Description;
      });
      
      return mp1;
    },
    
    // Timezone stuff
    utcHours:       function() { return alqwuutils.utcoffset; },
    utcOffset:      function() { return Math.floor(this.utcHours*60); },
    utcHoursString: function() { return this.utcHours < 0 ? this.utcHours.toString() : "+" + this.utcHours.toString(); },
    utcString:      function() { return alqwuutils.utcOffsetString(this.utcOffset); },
    
    dataToLoad: function() {
      let dtl = _.cloneDeep(this.dataFromFile);
      
      // Setup for offset and drift, if necessary
      // Works like this - the stepchange is the increment that the data change for
      //   every timestep.  Calculate that first, using the first & last values
      //   of the dataset.  Then the drift- and offset-compensated value is the 
      //   original value, plus the stepchange times the number of steps, plus the offset.
      // This assumes there are no gaps in the data.  It will be wrong if there are gaps.
      
      let firstdate = lx.DateTime
        .fromJSDate(new Date(dtl[0][this.datetimeField] + this.utcHoursString))
          .setZone(this.utcString);
      let lastdate  = lx.DateTime
        .fromJSDate(new Date(dtl[dtl.length-1][this.datetimeField] + this.utcHoursString))
          .setZone(this.utcString);
      
      if (this.metaToCreate.FrequencyMinutes != null) {
        let differenceInMinutes = lastdate.diff(firstdate, 'minutes').as('minutes');
        let totalTimesteps      = (differenceInMinutes/this.metaToCreate.FrequencyMinutes)+1;
        let missingTimesteps    = totalTimesteps - dtl.length;

        this.stepchange = this.drift/(totalTimesteps-1);
      };
      
      // Major potential issues if anyone ever uses the same column names
      //   that I'm using.  Should rewrite this to create a new array.
      let n = 0;
      dtl.forEach((d) => {
        d.dtm = lx.DateTime
          .fromJSDate(new Date(d[this.datetimeField] + this.utcHoursString))
          .setZone(this.utcString);
        
        d.CollectedDTM = d.dtm.toISO();
        
        d.Depth_M    = this.Depth_M == 'None'   ? null : d[this.Depth_M];
        d.Duplicate  = this.Duplicate == 'None' ? null : d[this.Duplicate];
        d.LabBatch   = this.LabBatch == 'None'  ? null : d[this.LabBatch];
        d.Note       = this.Note == 'None'      ? null : d[this.Note];
        d.Symbol     = this.Symbol == 'None'    ? null : d[this.Symbol];
        
        if (this.Qualifier == 'None' | this.Qualifier == null) {
          d.Qualifier = null
        } else {
          let qualifierName = d[this.Qualifier].trim();
          d.Qualifier = {..._.find(this.qualifiers, {'Code': qualifierName})}.QualifierID;
        };
        
        d.ValueOriginal = +d[this.valueField];
        
        // Calculate drift and offset, if applicable
        if (this.stepchange != 0 | this.offset != 0) {
          d.Value = _.round((d.ValueOriginal + ((this.stepchange*n) + this.offset)), this.metaToCreate.DecimalPoints);
          //d.Value = this.roundToDecimal(d.ValueOriginal + (stepchange*n) + this.offset, 2);
        } else {
          d.Value = d.ValueOriginal;
        };
        
        n += 1;
      });
      
      return dtl;
    },
    
    dataToLoadSummary: function() {
      let summary = {
        badDates:    [],
        nulls:       [],
        gaps:        [],
        sum:         0,
        mean:        null,
        min:         Infinity,
        max:         -Infinity,
        mindate:     this.dataToLoad[0].dtm,
        maxdate:     this.dataToLoad[0].dtm,
        inOrder:     true,
        badDateFlag: false,
        gapsFlag:    false,
        nullsFlag:   false
      };
      
      let lastDate = this.dataToLoad[0].dtm;
      
      this.dataToLoad.forEach((e, i, arr) => {
        
        if (e.dtm.invalid != null) {
          summary.badDates.push(i+1);
        } else {
          summary.mindate = e.dtm < summary.mindate ? e.dtm : summary.mindate;
          summary.maxdate = e.dtm > summary.maxdate ? e.dtm : summary.maxdate;
        };
        
        let textDate = e.dtm.toISO();
        
        if (e.Value == null) { 
          summary.nulls.push(textDate) 
        } else {
          summary.min = e.Value < summary.min ? e.Value : summary.min;
          summary.max = e.Value > summary.max ? e.Value : summary.max;
          summary.sum += e.Value;
        };
        
        
        if (i > 0 & this.metaToCreate.FrequencyMinutes != null) {
          let dateLessOneStep = e.dtm.minus({minutes: this.metaToCreate.FrequencyMinutes})
          if (+dateLessOneStep != +lastDate) {
            summary.gaps.push([textDate, dateLessOneStep, lastDate]);
          };
        };
        
        if (e.dtm < lastDate) {
          summary.inOrder = false;
        };
        
        lastDate = e.dtm;
      });
      
      summary.mean = _.round(summary.sum/this.dataToLoad.length, this.metaToCreate.DecimalPoints);
      summary.sum  = _.round(summary.sum, this.metaToCreate.DecimalPoints);
      
      summary.badDateFlag = summary.badDates.length > 0 ? true : false;
      summary.gapsFlag    = summary.gaps.length > 0     ? true : false;
      summary.nullsFlag   = summary.nulls.length > 0    ? true : false;
      
      return summary;
    },
    
    modalWidth: function() {
      return this.$refs.wrapper.clientWidth;
    },
    
    metaToCreateIncomplete: function() {
      let incomplete = this.metaToCreate.MethodID == null | 
        this.metaToCreate.ParameterID == null |
        this.metaToCreate.UnitID == null;
      return Boolean(incomplete);
    },
    
    disableNextButton: function() {
      return Boolean((this.screen == 'upload') | 
        (this.screen == 'metadataForm' & this.metaToCreateIncomplete));
    }
    
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
    
    getEquipmentList() {
      return $.ajax({
        url: `http://localhost:3000/api/v1/equipmentList`,
        method:  'GET',
        timeout: 3000
      });
    },
    
    getMatchingDataRecords() {
      let request = {
        spID:         this.SamplePointId,
        ParameterID:  this.metaToCreate.ParameterID,
        MethodID:     this.metaToCreate.MethodID,
        MinDate:      this.dataToLoad[0].CollectedDTM,
        MaxDate:      this.dataToLoad[this.dataToLoad.length-1].CollectedDTM
      };
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataBySPParamMethodDate`,
        method:  'GET',
        data:     request,
        timeout: 3000
      });
    },
    
    nextScreen() {
      if (this.screen == 'fieldSelect') {
        this.screen = 'metadataForm';
      } else if (this.screen == 'metadataForm') {
        this.screen = 'adjustAndReview';
      } else if (this.screen = 'adjustAndReview') {
        this.screen = 'upload';
        this.getMatchingDataRecords().done((drList) => {
          this.matchingDataRecords = drList;
        });
      }
    },
    
    lastScreen() {
      if (this.screen == 'metadataForm') {
        this.screen = 'fieldSelect';
      } else if (this.screen == 'adjustAndReview') {
        this.screen = 'metadataForm';
      } else if (this.screen == 'upload') {
        this.screen = 'adjustAndReview';
      }
    },
    
    fillMetaForm(metadata) {
      
      let interimMeta = _.cloneDeep(metadata);
      
      this.metaToCreate = interimMeta;
    },
    
    clickUpload() {
      if (this.matchingMeasuresCount == 0) {
        this.uploadData();
      } else {
        let calls = [];
        this.matchingDataRecords.forEach((dr) => {
          //calls.push(dr.MetadataID);
          let url = 'http://localhost:3000/api/v1/measurements?' + $.param({ "MetadataID": dr.MetadataID });
          calls.push(
            $.ajax({
              url:     url,
              method:  'DELETE',
              timeout: 3000
            }).done((result) => {
              //console.log(result);
            })
          );
        });
        
        console.log(calls);
        
        Promise.all(calls)
        .then((result) => {
          this.uploadData();
        }).catch((err) => {
          this.uploadResult.message = "Failed to delete existing data.";
          console.log(err);
        });;
      };
    },
    
    uploadData() {
      // Fill in all the metadata info that is specific to this file & not automatic
      
      this.metaToCreate.FileName             = this.filePath.replace(/^.*[\\\/]/, '');
      this.metaToCreate.DataStarts           = this.dataToLoadSummary.mindate.toISO();
      this.metaToCreate.DataEnds             = this.dataToLoadSummary.maxdate.toISO();
      this.metaToCreate.SamplePointID        = +this.SamplePointId;
      this.metaToCreate.UserID               = window.getConfig().userid;
      this.metaToCreate.CorrectionOffset     = this.offset;
      this.metaToCreate.CorrectionDrift      = this.drift;
      this.metaToCreate.CorrectionStepChange = this.stepchange;
      this.metaToCreate.UTCOffset            = alqwuutils.utcoffset*60;
      
      $.ajax({
        url:         `http://localhost:3000/api/v1/metadata`,
        data:        JSON.stringify(this.metaToCreate),
        contentType: 'application/json',
        method:      'POST',
        timeout:     3000
      }).done((metadataID) => {
        console.log("Loaded " + metadataID + " successfully.");
        
        // Once we have the ID of the new metadata, we load the data
        //   to the database in chunks of 30 at a time.  This keeps us
        //   from overloading the call and timing out, and allows us
        //   to provide feedback to the user about how much data has been 
        //   loaded during the upload.
        
        let calls         = [];
        
        let errors        = 0;
        let successes     = 0;
        let completeSteps = 0;
        let stepSize      = 30;    // The max number of rows to bulk insert.
        
        for (let i=0; i<this.dataToLoad.length; i+=stepSize) {
          let m = this.dataToLoad.slice(i, i+stepSize)
          let dataForAPI = {'metaid':       metadataID,
                            'offset':       alqwuutils.utcoffset*60,
                            'loadnumber':   i/stepSize,
                            'measurements': m};
          calls.push(
            $.ajax({
              type: 'POST',
              url:  'http://localhost:3000/api/v1/measurements',
              contentType: 'application/json',
              data: JSON.stringify(dataForAPI),
              dataType: 'json',
              timeout: 8000
            }).done((data) => {
              if (data != 'Success') {
                errors += m.length;
              } else {
                successes += m.length;
              }
            }).fail((err) => {
              errors += m.length;
            }).always(() => { 
              this.uploadResult.progress = Math.floor(((successes + errors) / this.dataToLoad.length) * 100);
              this.uploadResult.errors = errors;
              this.uploadResult.successes = successes;
              
              let nprocessed = errors + successes;
              this.uploadResult.message = `Processed ${nprocessed}; ${errors} errors and ${successes} successes.`;
            })
          );
        };

        Promise.all(calls)
        .then((result) => {
          let msg = "Done!";
          if (errors > 0) {
            msg = "Loading complete.  Encountered errors with " +
              errors + " records out of " +
              (errors + successes);
          } else {
            msg = "Loading complete.  Successfully loaded " +
              successes + " records.";
          };
          this.uploadResult.message = msg;
          
          // This gets the newly created data record and adds it to the list.
          this.getMatchingDataRecords().done((drList) => {
            this.matchingDataRecords = drList;
          });
        });
      });
    },
  },
  
  created() {
    this.getLatestMetas(this.SamplePointId).done((metas) => {
      this.Metadatas = metas;
    });
    
    this.getParameterList().done((params) => {
      this.parameters = params;
    });
    
    this.getMethodList().done((methodList) => {
      this.methods = methodList;
    });
    
    this.getUnitList().done((units) => {
      this.units = units;
    });
    
    this.getQualifierList().done((quals) => {
      this.qualifiers = quals;
    });
    
    this.getEquipmentList().done((equipment) => {
      this.equipment = equipment;
    });
  }
  
}
</script>

<template>
  <div ref="wrapper">
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
      
      <div class="col-10"
        v-if="screen == 'upload'">
        <h5 class="text-center">Upload Data</h5>
      </div>
      
      <div class="col-1">
        <button 
          id="backScreenButton" 
          type="button" 
          class="btn btn-light float-right"
          @click="nextScreen()"
          :disabled="disableNextButton"
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
            <small><strong><label for="parameter">Parameter</label></strong></small>
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
            <small><strong><label for="method">Method</label></strong></small>
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
            <small><strong><label for="unit">Unit</label></strong></small>
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
            <small><label for="sensor">Sensor</label></small>
            <v-select
              id="sensor"
              v-model="metaToCreate.EquipmentIDSensor"
              :options="equipment"
              label="Name"
              :reduce="equipment => equipment.EquipmentID">
            </v-select>
          </div>
        </div>
        
        <div class="row">
          <div class="form-group col-12">
            <small><label for="method">Logger</label></small>
            <v-select
              id="logger"
              v-model="metaToCreate.EquipmentIDLogger"
              :options="equipment"
              label="Name"
              :reduce="equipment => equipment.EquipmentID">
            </v-select>
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
        before moving to the upload screen.</p>
      
      <form>
        <div class="row">
        
          <div class="form-group col-6">
            <small><label for="offset">Offset</label></small>
            <input 
              id="offset"
              class="form-control"
              type="number"
              v-model.number="offset"></input>
          </div>
          
          <div class="form-group col-6">
            <small><label for="drift">Drift</label></small>
            <input 
              id="drift"
              class="form-control"
              type="number"
              :disabled="metaToCreate.FrequencyMinutes == null"
              v-model.number="drift"></input>
          </div>
          
        </div>
      </form>
      
      <div class="row">
        <div id="graph" class="col-12">
          <d3chart 
            :dataToLoad="dataToLoad"
            :width="modalWidth"
            :height="200" />
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <strong><p class="text-center">Summary Stats - {{ dataFromFile.length }} Records</p></strong>
        </div>
      </div>
      
      <div class="row">
        <div class="col-3" :class="{ 'text-danger': dataToLoadSummary.badDateFlag}">
          <p>Bad Dates: {{ dataToLoadSummary.badDates.length }}</p>
        </div>
        <div class="col-3" :class="{ 'text-warning': dataToLoadSummary.nullsFlag}">
          <p>Bad Values: {{ dataToLoadSummary.nulls.length }}</p>
        </div>
        <div class="col-3" :class="{ 'text-warning': dataToLoadSummary.gapsFlag}">
          <p>Gaps: {{ dataToLoadSummary.gaps.length }}</p>
        </div>
        <div class="col-3" :class="{ 'text-danger': !dataToLoadSummary.inOrder}">
          <p>Dates are {{ dataToLoadSummary.inOrder ? "" : "not" }} in order</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-3">
          <p>Min Value: {{ dataToLoadSummary.min }}</p>
        </div>
        <div class="col-3">
          <p>Mean Value: {{ dataToLoadSummary.mean }}</p>
        </div>
        <div class="col-3">
          <p>Max Value: {{ dataToLoadSummary.max }}</p>
        </div>
        <div class="col-3">
          <p>Sum: {{ dataToLoadSummary.sum }}</p>
        </div>
      </div>
      
    </div>
    
    <div id="upload"
      v-if="screen == 'upload'">
      
      <div class="row">
        <div class="col-12">
          <p> {{ this.uploadResult.message }} </p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <p v-if="matchingMeasuresCount > 0">
            There are {{ matchingMeasuresCount.toLocaleString()  }} records 
            at this site with the same parameter, method, and date.
          </p>
          <ul>
            <li v-for="dr in matchingDataRecords">
              File {{ dr.FileName }}, with {{ dr.nmeasures.toLocaleString() }} measurements, 
              from {{ dr.minDTString }} to {{ dr.maxDTString }}.
            </li>
          </ul>
        
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <button 
            id="uploadButton" 
            type="button" 
            class="btn btn-primary"
            @click="clickUpload()"
          >
            <span v-if="matchingMeasuresCount == 0">Upload</span>
            <span v-if="matchingMeasuresCount > 0">Delete and Upload</span>
          </button>
        </div>
        
      </div>
    
    </div>
    
    <br>
    
  </div>
</template>