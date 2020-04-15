
let Vue = require('vue')

Vue.directive('select', {
  twoWay: true,
  bind: function (el, binding, vnode) {
    $(el).select2().on("select2:select", (e) => {
      el.dispatchEvent(new Event('change', { target: e.target }));
    });
  },
});

$(document).ready(function() {
  $("#userSelect").select2({ width: '100%' });
});

//Vue.component('v-select', vSelect)

var vm = new Vue({
  el: '#v-pills-user',
  data: {
    UserID: null,
    users: [],
    locked: true,
    creatingNew: false,
    dirty: false,
    error: false,
    notificationText: `Click 'Edit' below to make changes, or 'New' to create a new User.`,
    currentUser: {
      UserID: null,
      Name:   null,
      Email:  null,
      Phone:  null,
      Active: null
    },
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
    this.updateUserList();
  },
  
  methods: {
    updateUserList: function(UserID) {
      let active = $("#user-activeFilterCheck").prop('checked') ? '?active=1': '';
      $.ajax({
        url: `http://localhost:3000/api/v1/userList${active}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.users = data;
        // Initial load
        if (typeof UserID === 'undefined') {
          this.getCurrentUser(data[0].UserID);
          this.UserID = data[0].UserID;
        // Subsequent updates
        } else {
          this.UserID = UserID;
        }
      }).fail((err) => {
        console.log(err);
      });
    },
    
    getCurrentUser: function(UserID) {
      this.locked = true;
      $.ajax({
        url: `http://localhost:3000/api/v1/user?UserID=${UserID}`,
        method:'GET',
        timeout: 3000
      }).done((data) => {
        this.currentUser = data;
        this.dirty = false;
        this.error = false;
        this.notificationText = `Click 'Edit' below to make changes, or 'New' to create a new User.`;
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not load the selected User.";
      }).always(() => {
        
      });
    },
    
    updateUser: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/user`,
        method:'PUT',
        timeout: 3000,
        data: JSON.stringify(this.currentUser),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.dirty  = false;
        this.error  = false;
        this.locked = false;
        this.notificationText = "Successfully updated!";
      }).fail((err) => {
        console.log(err);
        this.error = true;
        this.notificationText = "Could not update the User.  Please double-check the values.";
      });
    },
    
    newUserClick: function() {
      if (this.creatingNew) {
        this.saveNewUser();
      } else {
        this.editNewUser();
      };
    },
    
    editNewUser: function() {
      for (const prop in this.currentUser) {
        this.currentUser[prop] = null;
      };
      this.currentUser.Active = true;
      this.creatingNew = true;
      this.locked = false;
      this.notificationText = "Fill in at least the site and name fields below.  'Save' to create new User."
    },
    
    saveNewUser: function() {
      $.ajax({
        url: `http://localhost:3000/api/v1/user`,
        method:'POST',
        timeout: 3000,
        data: JSON.stringify(this.currentUser),
        dataType: 'json',
        contentType: 'application/json'
      }).done((data) => {
        this.notificationText = "Successfully added new User!";
        this.UserID = data;
        this.updateUserList(this.UserID);
        this.currentUser.UserID = data;
        this.creatingNew = false;
        this.dirty       = false;
        this.error       = false;
        this.locked      = false;
      }).fail((err) => {
        console.log(err.status + ": " + err.responseJSON);
        this.error = true;
        this.notificationText = "Could not add the User.  Please double-check the values.";
      });
    },
    
    cancelUser: function() {
      this.getCurrentUser(this.UserID);
      
      this.creatingNew = false;
      this.locked      = true;
      this.error       = false;
      this.dirty       = false;
    },
    
    clickEditUser: function() {
      if (this.locked) {
        this.locked = false;
        this.dirty  = true;
        this.notificationText = "Change values below to edit; click Save when done, Cancel to discard."
      } else {
        this.updateUser();
      }
    }
  }
})

