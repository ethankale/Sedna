
let alqwuutils     = require('./utils.js');
let Vue = require('vue')

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
  data: {
    qualifiers: [],
    QualifierID: 0,
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Qualifier.",
    currentQualifier: {
      QualifierID:      null,
      Code:      null,
      Description: null
    }
  },
  computed: {
    editButtonText: function() {
      return this.locked ? 'Edit' : 'Save';
    },
    
    newButtonText: function() {
      return this.creatingNew ? 'Save' : 'New';
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
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/qualifier?QualifierID=${QualifierID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentQualifier = data;
        this.dirty = false;
        this.error = false;
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
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
        this.updateQualifierList(this.QualifierID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Qualifier.  Please double-check the values.";
      });
    },
    
    newQualifierClick: function() {
      if (this.creatingNew) {
        this.saveNewQualifier();
      } else {
        this.editNewQualifier();
      };
    },
    
    editNewQualifier: function() {
      for (const prop in this.currentQualifier) {
        this.currentQualifier[prop] = null;
      };
      this.creatingNew        = true;
      this.locked             = false;
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
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Qualifier.  Please double-check the values.";
      });
    },
    
    cancelQualifier: function() {
      this.getCurrentQualifier(this.QualifierID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditQualifier: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateQualifier();
      }
    },
  }
})

