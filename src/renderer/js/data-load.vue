<script>
let Papa       = require('papaparse');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');

let $          = require('jquery');

import DataCSVLoad from './data-csv-load.vue';

// Generic functions

// From column selection back to CSV upload
var showUpload = function() {
    $("#uploadCSVContainer").removeClass("d-none");
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");
    $("#uploadFileName").text("Select a File...");

    $("#uploadBackButton")
      .addClass("d-none")
      .off("click");

    $("#uploadNextButton")
      .removeClass("d-none")
      .addClass("disabled")
      .off("click");

    vm.setNotice('alert-info', 'Select a file...');
};

var showColumnSelect = function() {
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadColumnSelectContainer").removeClass("d-none");
    $("#uploadReviewContainer").addClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");
    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });

    vm.setNotice('alert-info', 'Match the CSV headers with the correct metadata.');
};

// From column selection to data review
var showReview = function() {
    $("#uploadColumnSelectContainer").addClass("d-none");
    $("#uploadCSVContainer").addClass("d-none");
    $("#uploadReviewContainer").removeClass("d-none");
    $("#addSingleMeasurement").addClass("d-none");

    $("#uploadBackButton")
      .removeClass("d-none")
      .off("click")
      .click(() => { showUpload(); });

    $("#uploadNextButton")
      .addClass("d-none");

    vm.setNotice('alert-info', 'Review uploaded data for accuracy.');
};

var reviewData = function() {

  showReview();

  $('#uploadReviewTab a:first').tab('show')

};

export default {
  components: {
    'data-csv-load': DataCSVLoad
  },
  
  props: {
    SamplePointId: Number
  },
  
  data: function() {
    return {
      utcHours: alqwuutils.utcoffset,

      qualifiers: [],

      filePath: 'Select a File...',
      fileText: '',
      fileData: {
        meta: {
          fields: []
        }
      },
      metasFromSite:     [],
      uploadProgress:    0,

      singleMeasureData: {
        'metaid':  null,
        'offset':  null,
        'datestr': '',
        'measurements': [
          {
            'Value':                null,
            'CollectedDTM':         null,
            'QualifierID':          null,
            'Depth_M':              null,
            'Duplicate':            false,
            'LabBatch':             null,
            'Symbol':               '=',
            'Note':                 ''
          }
        ]
      },

      singleMeasureExists: false,

      // Using negative numbers because metadata ids will always be >= zero.
      emptyID:     -1,
      datetimeID:  -2,
      qualifierID: -3,
      depthID:     -4,
      dupID:       -5,
      labBatchID:  -6,
      symbolID:    -7,
      noteID:      -8,

      headerMetadataMap: {},
      headerNotices:     {},
      measurements:      [],

      papaConfig:     {
        quoteChar: '"',
        header: true,
        skipEmptyLines: true,
        fastMode: false,
        transformHeader: function(h) {
          return h.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_ -]/g, '');
        }
      }
    }
  },

  computed: {

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

    status: function() {
      let status = "selecting_file";
      if (typeof(this.fileData.data) === 'undefined') {
        status = "selecting_file";
      } else if (this.dtmColName === null || this.columnCount < 2) {
        status = "matching_headers";
      } else {
        status = "ready_to_upload";
      };
      return status;
    },

    headers: function() {
      return this.fileData.meta.fields;
    },


    metas: function() {
      return this.metasFixed.concat(this.metasFromSite);
    },

    columnCount: function() {
      let metaIDs = Object.values(this.headerMetadataMap);
      return metaIDs.filter(m => m.metaid != this.emptyID).length;
    },

    singleMeasureUploadBtnText: function() {
      return this.singleMeasureExists ? "Overwrite" : "Upload";
    }
  },

  methods: {

    getMetas(spID) {
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataBySamplePt?spID=${spID}`,
        method:  'GET',
        timeout: 3000
      })
    },

    getMeasurementCount(headerWithMeta) {
      let data = {
        "metaid":    headerWithMeta.metaid,
        "startdtm":  headerWithMeta.mindate.toString(),
        "enddtm":    headerWithMeta.maxdate.toString(),
        "utcoffset": this.utcoffset
      };

      return $.ajax({
        url:         'http://localhost:3000/api/v1/getMeasurementCount',
        contentType: 'application/json',
        type:        'GET',
        data:        data,
        timeout:     3000
      });
    },

    showSingleMeasurement() {
      let spID = $("#spSelect").val();
      if (spID != null) {

        this.getMetas(spID).done((metas) => {
          this.metasFromSite = metas;
        });

        this.filePath = "Single Measurement"

        $("#uploadColumnSelectContainer").addClass("d-none");
        $("#uploadCSVContainer").addClass("d-none");
        $("#uploadReviewContainer").addClass("d-none");
        $("#addSingleMeasurement").removeClass("d-none");

        $("#uploadBackButton")
          .removeClass("d-none")
          .off("click")
          .click(() => { showUpload(); });

        $("#uploadNextButton")
          .addClass("d-none");

        vm.setNotice('alert-info', 'Fill in details to load a single measurement.');

      } else {
        this.setNotice('alert-danger', 'There was a problem finding this sample point.');
      };
    },

    clickUploadSingleMeasure() {
      let workupPayload = {
        'metaid':  this.singleMeasureData.metaid,
        'mindate': this.singleMeasureData.measurements[0].CollectedDTM,
        'maxdate': this.singleMeasureData.measurements[0].CollectedDTM
      };
      if (this.singleMeasureExists) {
        let deletePayload = {
          'metaid':  this.singleMeasureData.metaid,
          'mindate': this.singleMeasureData.measurements[0].CollectedDTM,
          'maxdate': this.singleMeasureData.measurements[0].CollectedDTM
        };
        this.deleteMeasurements(deletePayload)
        .done((data) => {
          this.setSingleMeasure()
          .done((data) => {
            this.setNotice('alert-success', 'Successfully uploaded a single measurement.');
            this.singleMeasureExists = false;
            this.setWorkup(workupPayload);
          })
          .fail((err) => {
            this.setNotice('alert-warning', 'Deleted existing measurement, but could not add the new one.');
          })
        })
        .fail((err) => {
          this.setNotice('alert-warning', 'Could not delete existing measurement.');
        })
      } else {
        this.setSingleMeasure()
        .done((data) => {
          this.setNotice('alert-success', 'Successfully uploaded a single measurement.');
          this.singleMeasureExists = false;
          this.setWorkup(workupPayload);
        })
        .fail((err)=> {
          if (err.status == 409) {
            this.setNotice('alert-warning', 'This measurement already exists in the database.  Overwrite?');
            this.singleMeasureExists = true;
          } else {
            this.setNotice('alert-danger', 'Upload failed.  Server message: ' + err.responseText);
          };
        });
      };
    },
    
    setSingleMeasure() {
      let ajaxData = JSON.stringify(this.singleMeasureData);
      return $.ajax({
        url:      'http://localhost:3000/api/v1/measurements',
        contentType: 'application/json',
        method:   'POST',
        timeout:  3000,
        dataType: 'json',
        data:     ajaxData
      });
    },
    
    singleMeasureDTMChange() {
      let dtString = this.singleMeasureData.datestr;
      this.singleMeasureData.offset = this.utcoffset;

      this.singleMeasureData.measurements[0].CollectedDTM = lx.DateTime
          .fromJSDate(new Date(dtString + this.utcHoursString))
          .setZone(this.utcstring);
      this.singleMeasureExists = false;
    },
    
    reset() {
      $("#uploadColumnSelectContainer select").val(-1).change();
      
      this.filePath                = '';
      this.fileText                = '';
      this.headerMetadataMap       = {};

      delete this.fileData.data;
    },

    setNotice(cls, msg) {
      $("#uploadAlert")
        .removeClass("alert-success alert-danger alert-primary alert-info alert-warning")
        .addClass(cls)
        .text(msg);
    },

    roundToDecimal(number, decimal) {
      return Math.round(number*Math.pow(10, decimal))/Math.pow(10, decimal);
    }
  }
}

</script>

<template>
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Upload Data</h5>
        <button 
          id="uploadClose" 
          type="button" 
          class="close" 
          v-on:click="$emit('close-modal')"
          data-dismiss="modal" 
          aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="modal-body">
        <data-csv-load 
         :sample-point-id="SamplePointId"></data-csv-load>
      </div>
    </div>
  </div>
</template>

