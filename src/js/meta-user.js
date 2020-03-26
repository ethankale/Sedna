

$(document).ready(function() {
  
  $("#userSelect").select2({ width: 'resolve' });
  $("#userSelect").change(function() {
    disableEditUser();
    let userid = $("#userSelect :selected").val()
    fillUserDetails(userid);
  });
  
  $("#user-edit").click(function() {
    editUser();
  });
  
  $("#user-new").click(function() {
    clickNewUserButton();
  });
  
  loadUserList();
  
});

function editUser() {
  $("#userFieldset").prop('disabled', false);
  $("#user-edit")
    .text("Lock")
    .off('click')
    .on('click', function() {disableEditUser()});
  $("#user-update")
    .prop('disabled', false)
    .on('click', function() { clickUserUpdateButton() });
  $("#user-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Modify the fields to edit this user")
}

function disableEditUser() {
  $("#userFieldset").prop('disabled', true);
  $("#user-edit")
    .text("Edit")
    .off('click')
    .on('click', function() { editUser() });
  $("#user-update")
    .prop('disabled', true)
    .off('click');
  $("#user-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Review or edit users.")
}

function clickUserUpdateButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Update the currently selected user?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .text('Update User')
    .on('click', function() { updateUser() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
};

function updateUser() {
  let user = makeUserObject();
  
  $.ajax({
    url: 'http://localhost:3000/api/v1/user',
    contentType: 'application/json',
    method: 'PUT',
    data: JSON.stringify(user),
    dataType: 'json',
    timeout: 3000,
  }).done(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-danger alert-info")
      .addClass("alert-success")
      .text("Successfully updated.");
  }).fail(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-success alert-info")
      .addClass("alert-danger")
      .text("Update failed; check your data.");
  }).always(function() {
    $("#updateDataButton")
      .off('click')
      .prop('disabled', true);
    $("#updateDataCloseButton")
      .text("Close")
  });
}

function loadUserList(userid) {
  $.ajax({url: 'http://localhost:3000/api/v1/userList'
  }).done(function(data) {
    let options = '';
    
    data.forEach(user => {
      options += `<option 
        value=${user.UserID}>
        ${user.Name}
        </option>`
    });
    
    $('#userSelect').empty().append(options);
    
    if (typeof userid == 'undefined') {
      $("#userSelect").change();
    } else {
      $("#userSelect").val(userid).change();
    };
    $("#user-narrative")
      .removeClass("alert-primary alert-success alert-danger")
      .addClass("alert-info")
      .text("Review or edit users.")
  }).fail(() => {
    $("#user-narrative")
      .removeClass("alert-primary alert-success  alert-info")
      .addClass("alert-danger")
      .text("Couldn't find any users to load.")
  });
};

function fillUserDetails(userid) {
  $.ajax({url: `http://localhost:3000/api/v1/user?userid=${userid}`
  }).done((data) => {
    
    let username = data[0].Name;
    let email    = data[0].Email;
    let phone    = data[0].Phone;
    
    $("#user-name").val(username);
    $("#user-email").val(email);
    $("#user-phone").val(phone);
    
  }).fail(() => {
    $("#user-narrative")
      .removeClass("alert-primary alert-success  alert-info")
      .addClass("alert-danger")
      .text("Couldn't find any users to load.")
  });
};

function makeUserObject() {
  let user = {};
  
  user.userid  = $("#userSelect").val();
  user.name    = $("#user-name").val();
  user.phone   = $("#user-phone").val();
  user.email   = $("#user-email").val();
  
  return user;
}

function clickNewUserButton() {
  $("#user-name").val("");
  $("#user-phone").val("");
  $("#user-email").val("");
  $("#userFieldset").prop('disabled', false);
  $("#user-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Fill in the values below to create a new user.")
  
  $("#user-edit")
    .prop('disabled', true)
    .off('click');
  $("#user-update")
    .prop('disabled', true)
    .off('click');
  
  $("#user-selectHeader").addClass("d-none");
  
  $("#user-new")
    .text("Create")
    .off("click")
    .on("click", function() {
        clickCreateUserButton();
    });
  
  $("#user-cancel")
    .prop('disabled', false)
    .off('click')
    .on('click', function() { cancelNewUser() });
}

function clickCreateUserButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Create a new user?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .text('Create')
    .on('click', function() { createNewUser() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
}

function createNewUser() {
  let user = makeUserObject();
  console.log(user);
  $.ajax({
    url: 'http://localhost:3000/api/v1/user',
    contentType: 'application/json',
    method: 'POST',
    data: JSON.stringify(user),
    dataType: 'json',
    timeout: 3000,
  }).done(function(data) {
    //console.log(data);
    $("#updateAlert")
      .removeClass("alert-primary alert-danger alert-info")
      .addClass("alert-success")
      .text("Successfully added new user.");
    cancelNewUser();
    
    loadUserList(data);
    
  }).fail(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-success alert-info")
      .addClass("alert-danger")
      .text("Could not insert new user; check your data.");
  }).always(function() {
    $("#updateDataButton")
      .off('click')
      .prop('disabled', true);
    $("#updateDataCloseButton")
      .text("Close")
  });
}

function cancelNewUser() {
    $('#user-selectHeader').removeClass('d-none');
    disableEditUser();
    $("#userSelect").change();
    $("#user-cancel").prop('disabled', true);
    $("#user-edit")
      .prop('disabled', false)
      .off('click')
      .on('click', function() { editUser() });
    $("#user-new")
      .text("New")
      .off('click')
      .on('click', function() { clickNewUserButton(); });
    $("#user-narrative")
      .removeClass("alert-primary alert-success alert-danger")
      .addClass("alert-info")
      .text("Review or edit users.")
}
