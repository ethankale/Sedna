
let alqwuutils = require('./utils.js');
let Vue        = require('vue')
let $          = require('jquery');
let select2    = require('select2');

import NewEditCancel from './new-edit-cancel.vue';

let utcoffset  = alqwuutils.utcoffset;

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#qualifierSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-qualifier',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    qualifiers: [],
    QualifierID: 0,
    
    editstate: 'view',
    error: false,
    
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Qualifier.",
    currentQualifier: {
      QualifierID:      null,
      Code:      null,
      Description: null
    }
  },
  
  mounted: function () {
    this.updateQualifierList();
  },
  
  methods: {
    updateQualifierList: function(QualifierID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/qualifierList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.qualifiers = data;
        if (typeof QualifierID === 'undefined') {
          this.getCurrentQualifier(data[0].QualifierID);
          this.QualifierID = data[0].QualifierID;
        } else {
          this.QualifierID = QualifierID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentQualifier: function(QualifierID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/qualifier?QualifierID=${QualifierID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentQualifier = data;
        this.editstate        = 'view';
        this.error            = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Qualifier.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Qualifier.";
      }).always(() => {
      });
    },
    
    updateQualifier: function() {
      console.log(JSON.stringify(this.currentQualifier));
      $.ajax({
        url: `http://localhost:3000/api/v1/qualifier`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentQualifier),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.editstate = 'view';
        this.error     = false;
        this.notificationText = "Successfully updated!";
        this.updateQualifierList(this.QualifierID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Qualifier.  Please double-check the values.";
      });
    },
    
    clickNewQualifier: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewQualifier();
      } else {
        this.saveNewQualifier();
      };
    },
    
    editNewQualifier: function() {
      for (const prop in this.currentQualifier) {
        this.currentQualifier[prop] = null;
      };
      this.notificationText   = "Fill in fields below.  'Save' to create new Qualifier."
    },
    
    saveNewQualifier: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/qualifier`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentQualifier),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Qualifier!";
        this.QualifierID = data;
        this.updateQualifierList(this.QualifierID);
        this.currentQualifier.QualifierID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Qualifier.  Please double-check the values.";
      });
    },
    
    clickCancelQualifier: function() {
      this.getCurrentQualifier(this.QualifierID);
      
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditQualifier: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateQualifier();
      };
    }
  }
})

