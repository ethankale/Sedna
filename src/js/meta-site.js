
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
  $("#siteSelect").select2(     { width: '100%' });
});

var vm = new Vue({
  el: '#v-pills-site',
  data: {
    sites: [],
    siteID: 0,
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: "Click 'Edit' below to make changes, or 'New' to create a new Data Record.",
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
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/site?siteid=${SiteID}&utcoffset=${utcoffset}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentSite = data[0];
        this.dirty = false;
        this.error = false;
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
        this.dirty  = false;
        this.error  = false;
        this.locked = true;
        this.notificationText = "Successfully updated!";
        this.updateSiteList(this.siteID);
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the Site.  Please double-check the values.";
      });
    },
    
    newSiteClick: function() {
      if (this.creatingNew) {
        this.saveNewSite();
      } else {
        this.editNewSite();
      };
    },
    
    editNewSite: function() {
      for (const prop in this.currentSite) {
        this.currentSite[prop] = null;
      };
      this.currentSite.Active = true;
      this.creatingNew        = true;
      this.locked             = false;
      this.notificationText   = "Fill in fields below.  'Save' to create new Data Record."
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
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = true;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not add the Site.  Please double-check the values.";
      });
    },
    
    cancelSite: function() {
      this.getCurrentSite(this.siteID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditSite: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateSite();
      }
    },
  }
})

