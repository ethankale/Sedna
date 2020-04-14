
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
  $("#methodSelect").select2({ width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-method',
  data: {
    methods: [],
    MethodID: 0,
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Method.",
    currentMethod: {
      MethodID:    null,
      Code:        null,
      Description: null,
      Reference:   null
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
    let self = this;
    
    self.updateMethodList();
  },
  methods: {
    updateMethodList: function(MethodID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/methodList`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.methods = data;
        if (typeof MethodID === 'undefined') {
          this.getCurrentMethod(data[0].MethodID);
          this.MethodID = data[0].MethodID;
        } else {
          this.MethodID = MethodID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentMethod: function(MethodID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/method?MethodID=${MethodID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentMethod = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Method.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Method.";
      }).always(() => {
      });
    },
    
    updateMethod: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/method`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentMethod),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
        this.updateMethodList(this.MethodID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Method.  Please double-check the values.";
      });
    },
    
    newMethodClick: function() {
      if (this.creatingNew) {
        this.saveNewMethod();
      } else {
        this.editNewMethod();
      };
    },
    
    editNewMethod: function() {
      for (const prop in this.currentMethod) {
        this.currentMethod[prop] = null;
      };
      this.creatingNew        = true;
      this.locked             = false;
      this.notificationText   = "Fill in fields below.  'Save' to create new Method."
    },
    
    saveNewMethod: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/method`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentMethod),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Method!";
        this.MethodID = data;
        this.updateMethodList(this.MethodID);
        this.currentMethod.MethodID = data;
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Method.  Please double-check the values.";
      });
    },
    
    cancelMethod: function() {
      this.getCurrentMethod(this.MethodID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditMethod: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateMethod();
      }
    },
  }
})

