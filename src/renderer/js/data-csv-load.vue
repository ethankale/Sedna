<script>
let Papa       = require('papaparse');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');

let $          = require('jquery');
let select2    = require('select2');

import dataReviewUpload from './data-review-upload.vue';

export default {

  components: {
    'data-review-upload': dataReviewUpload
  },

  data: function() {
    return {
      SamplePointID: null,
      
      utcHours: alqwuutils.utcoffset,

      qualifiers: [],

      filePath: 'Select a File...',
      fileText: '',
      fileData: {
        meta: {
          fields: []
        }
      },
      
      columnsToLoad: [],
      datetimeCol:   '',
      
      papaConfig:     {
        quoteChar: '"',
        header: true,
        skipEmptyLines: true,
        fastMode: false,
        transformHeader: function(h) {
          return h.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_ -]/g, '');
        }
      },
      
      showContainer: 'uploadCSV',
      
      uploadProgress: 0
    }
  },
  
  computed: {
  },
  
  methods: {
    setNotice(cls, msg) {
      $("#uploadAlert")
        .removeClass("alert-success alert-danger alert-primary alert-info alert-warning")
        .addClass(cls)
        .text(msg);
    },

    openCSV() {
      this.setNotice('alert-primary', 'Loading file now...');

      let fileParsed = window.openCSV();
      this.filePath = fileParsed[0];
      this.fileText = fileParsed[1];

      // Even with the transform header function we may get some column names
      //   that are invalid selectors.  in theory we could search for the CSS
      //   valid selector regex -?[_a-zA-Z]+[_a-zA-Z0-9-]* and replace anything
      //   that doesn't match, but replace with what?

      this.fileData      = Papa.parse(this.fileText, this.papaConfig);
      this.SamplePointID = $("#spSelect").val();  // seriously ugly - refactor to Vue-friendly
      
      if (this.fileData.data.length > 0) {
        this.setNotice('alert-success', 'File load complete!  Select the columns with data you wish to load.');

        if (this.SamplePointID != null) {
          this.showContainer = 'pickColumns';
        } else {
          this.setNotice('alert-danger', 'There was a problem finding this sample point.');
        }
      } else {
        this.setNotice('alert-danger', 'Could not read the specified file.  Check the format and try again.');
      };
    },
    
    reviewData() {
      let readyToProceed = this.datetimeCol != '' & 
        this.columnsToLoad.length > 0 &
        !this.columnsToLoad.includes(this.datetimeCol);
      if (readyToProceed) {
        this.showContainer = 'reviewData';
        this.setNotice('alert-info', 'Finish loading the data.');
      } else {
        this.setNotice('alert-warning', 'Pick a date/time column and at least one data column to proceed.');
      };
    },
    
    backToUpload() {
      this.setNotice('alert-info', 'Select a File...');
      this.showContainer = 'uploadCSV';
    },
    
    backToColumns() {
      this.setNotice('alert-info', 'Select the columns with data you wish to load.');
      this.datetimeCol   = '';
      this.columnsToLoad = [];
      this.showContainer = 'pickColumns';
    }
  }
}
</script>

<template>
  <div class="container-fluid">
  
    <div id="uploadAlert" class="row alert alert-info" role="alert">
      Load data from a CSV file
    </div>
    
    <div 
      id="uploadCSV"
      v-if="showContainer == 'uploadCSV'">
      
      <div class="row">
        <div class="col-6">
          <button 
            id="openCSVFileButton" 
            type="button" 
            class="btn btn-primary"
            @click="openCSV()"
          >Open CSV</button>
        </div>
        
        <!-- <div class="col-6"> -->
          <!-- <button  -->
            <!-- id="newSingleMeasurementButton"  -->
            <!-- type="button"  -->
            <!-- class="btn btn-primary float-right" -->
            <!-- @click="showSingleMeasurement()">Single Measurement</button> -->
        <!-- </div> -->
      </div>
    </div>
    
    <div 
      id="pickColumns"
      v-if="showContainer == 'pickColumns'">
      
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Column</th>
            <th scope="col">Date/Time Field</th>
            <th scope="col">Data Field(s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="col in fileData.meta.fields">
            <td>{{ col.trim() }}</td>
            <td>
              <input type="radio" name="datetimecol" :value="col" v-model="datetimeCol" />
            </td>
            <td>
              <input type="checkbox" :value="col" v-model="columnsToLoad" />
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="row bg-light">
        
        <div class="col-6">
          <button 
            id="backToUploadButton" 
            type="button" 
            class="btn btn-primary"
            @click="backToUpload()"
          >Back</button>
        </div>
        
        <div class="col-6">
          <button 
            id="reviewDataButton" 
            type="button" 
            class="btn btn-primary float-right"
            @click="reviewData()"
          >Review Data</button>
        </div>
        
      </div>
      
    </div>
    
    <div
      id="reviewData"
      v-if="showContainer == 'reviewData'">
      
      <ul id="uploadReviewTab" class="nav nav-tabs" role="tablist">
        <li v-for="column in columnsToLoad"
          class="nav-item">
          <a 
            class="nav-link" 
            data-toggle="tab" 
            role="tab" 
            v-bind:id="column + '-tab'" 
            v-bind:href="'#' + column" 
            v-bind:aria-controls="column"
          >{{ column.trim() }}</a>
        </li>
      </ul>
      
      <div class="tab-content" id="uploadReviewTabContent">
        <div 
          v-for="column in columnsToLoad"
          class="tab-pane fade" 
          v-bind:id="column" 
          role="tabpanel" 
          v-bind:aria-labelledby="column + '-tab'">
          
          <data-review-upload 
            :fields="fileData.meta.fields"
            :SamplePointID="SamplePointID"
            :datetimeField="datetimeCol"
            :valueField="column"
            :dataFromFile="fileData.data"
            :filePath="filePath"></data-review-upload>
          
        </div>
      </div>
      
      <div class="row bg-light">
      
        <div class="col-6">
          <button 
            id="backToReviewButton" 
            type="button" 
            class="btn btn-primary"
            @click="backToColumns()"
          >Back</button>
        </div>
        
        <div class="col-6">&nbsp;</div>
      </div>
      
    </div>
    
    <div class="row bg-light">
      <div class="col-12">
        <small id="uploadFileName" class="text-muted">{{ filePath }}</small>
      </div>
    </div>
  </div>

</template>