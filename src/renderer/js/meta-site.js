
let alqwuutils = require('./utils.js');
let Vue        = require('vue');

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
  $("#siteSelect").select2({ width: '100%' });
});

/* var NewEditCancel = {
  props: {'editstate': String},
  computed: {
    editButtonText: function() {
      return this.editstate === 'edit' ? 'Save' : 'Edit';
    },
    newButtonText: function() {
      return this.editstate === 'new' ? 'Save' : 'New';
    },
    editDisabled: function() {
      return this.editstate === 'new' ? true : false;
    },
    newDisabled: function() {
      return this.editstate === 'edit' ? true : false;
    },
    cancelDisabled: function() {
      return this.editstate === 'view' ? true : false;
    }
  },
  template: `
    <div class="form-row">
    
      <div class="col-md-2">
        <button id="site-edit" type="button" class="btn btn-primary"
          @click="$emit('click-edit-site')" :disabled="editDisabled"> {{ editButtonText }}</button>
      </div>
      
      <div class="col-md-8">
        <button id="site-new" type="button" class="btn btn-secondary"
          @click="$emit('click-new-site')" :disabled="newDisabled"> {{ newButtonText }}</button>
      </div>
      
      <div class="col-md-2">
        <button id="site-cancel" type="button" class="btn btn-secondary float-right"
          @click="$emit('click-cancel-site')" :disabled="cancelDisabled">Cancel</button>
      </div>
      
    </div>
  `
}; */

var vm = new Vue({
  el: '#v-pills-site',
  components: {
    'new-edit-cancel': NewEditCancel
  },
  data: {
    sites: [],
    siteID: 0,
    
    editstate: 'view',
    error: false,
    
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Site.",
    currentSite: {
      SiteID:           null,
      Code:             null,
      Name:             null,
      Address:          null,
      City:             null,
      ZipCode:          null,
      Active:           null,
      Description:      null,
      SamplePointCount: 0,
      MetadataCount:    0
    }
  },
  mounted: function () {
    let self = this;
    self.updateSiteList();
  },
  methods: {
    updateSiteList: function(siteID) {
      let active = $("#site-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/getsites${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.sites = data;
        if (typeof siteID === 'undefined') {
          this.getCurrentSite(data[0].SiteID);
          this.siteID = data[0].SiteID;
        } else {
          this.siteID = siteID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentSite: function(SiteID) {
      $.ajax({
        url: `http://localhost:3000/api/v1/site?siteid=${SiteID}&utcoffset=${utcoffset}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentSite = data[0];
        this.error = false;
        this.editstate = 'view';
        this.notificationText = "Click 'Edit' below to make changes, or 'New' to create a new Site.";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected Site.";
      }).always(() => {
      });
    },
    
    updateSite: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/site`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentSite),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.error  = false;
        this.editstate = 'view';
        this.notificationText = "Successfully updated!";
        this.updateSiteList(this.siteID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Site.  Please double-check the values.";
      });
    },
    
    clickNewSite: function() {
      if (this.editstate == 'view') {
        this.editstate = 'new';
        this.editNewSite();
      } else {
        this.saveNewSite();
      };
    },
    
    editNewSite: function() {
      for (const prop in this.currentSite) {
        this.currentSite[prop] = null;
      };
      this.currentSite.Active = true;
      this.notificationText   = "Fill in fields below.  'Save' to create new Site."
    },
    
    saveNewSite: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/site`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentSite),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new Site!";
        this.siteID = data;
        this.updateSiteList(this.siteID);
        this.currentSite.SiteID = data;
        
        this.editstate = 'view';
        this.error     = false;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Site.  Please double-check the values.";
      });
    },
    
    clickCancelSite: function() {
      this.getCurrentSite(this.siteID);
      this.editstate = 'view';
      this.error     = false;
    },
    
    clickEditSite: function() {
      if (this.editstate == 'view') {
        this.editstate = 'edit';
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard.";
      } else {
        this.updateSite();
      };
    },
  }
})

