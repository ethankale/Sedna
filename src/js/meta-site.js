

$(document).ready(function() {
  
  $("#siteSelect").select2({ width: '100%' });
  $("#siteSelect").change(function() {
    disableEditsite();
    let siteid = $("#siteSelect :selected").val()
    fillSiteDetails(siteid);
  });
  
  $("#site-edit").click(function() {
    editSite();
  });
  
  $("#site-new").click(function() {
    clickNewSiteButton();
  });
  
  loadSiteList();
  
});

function editSite() {
  $("#siteFieldset").prop('disabled', false);
  $("#site-edit")
    .text("Lock")
    .off('click')
    .on('click', function() {disableEditsite()});
  $("#site-update")
    .prop('disabled', false)
    .on('click', function() { clickSiteUpdateButton() });
  $("#site-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Modify the fields to edit this site")
}

function disableEditsite() {
  $("#siteFieldset").prop('disabled', true);
  $("#site-edit")
    .text("Edit")
    .off('click')
    .on('click', function() { editSite() });
  $("#site-update")
    .prop('disabled', true)
    .off('click');
  $("#site-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Review or edit sites.")
}

function clickSiteUpdateButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Update the currently selected site?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .text('Update site')
    .on('click', function() { updateSite() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
};

function updateSite() {
  let site = makeSiteObject();
  
  $.ajax({
    url: 'http://localhost:3000/api/v1/site',
    contentType: 'application/json',
    method: 'PUT',
    data: JSON.stringify(site),
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

function loadSiteList(siteid) {
  $.ajax({url: 'http://localhost:3000/api/v1/getsites'
  }).done(function(data) {
    let options = '';
    
    data.forEach(site => {
      options += `<option 
        value=${site.SiteID}>
        ${site.Code}: ${site.Name}
        </option>`
    });
    
    $('#siteSelect').empty().append(options);
    
    if (typeof siteid == 'undefined') {
      $("#siteSelect").change();
    } else {
      $("#siteSelect").val(siteid).change();
    };
    $("#site-narrative")
      .removeClass("alert-primary alert-success alert-danger")
      .addClass("alert-info")
      .text("Review or edit sites.")
  }).fail(() => {
    $("#site-narrative")
      .removeClass("alert-primary alert-success  alert-info")
      .addClass("alert-danger")
      .text("Couldn't find any sites to load.")
  });
};

function fillSiteDetails(siteid) {
  $.ajax({url: `http://localhost:3000/api/v1/site?siteid=${siteid}`
  }).done((data) => {
    
    let code        = data[0].Code;
    let sitename    = data[0].Name;
    let address     = data[0].Address;
    let city        = data[0].City;
    let zip         = data[0].ZipCode;
    let description = data[0].Description;
    let samplepts   = data[0].SamplePointCount;
    let metadatas   = data[0].MetadataCount;
    
    let narrative   = `This site has 
      <strong>${samplepts}</strong> associated sample points with
      <strong>${metadatas}</strong> associated data records.`
    
    $("#site-code").val(code);
    $("#site-name").val(sitename);
    $("#site-address").val(address);
    $("#site-city").val(city);
    $("#site-zip").val(zip);
    $("#site-description").val(description);
    
    $("#site-narrative")
      .removeClass("alert-primary alert-success alert-danger alert-info")
      .html(narrative)
    
    if (samplepts == 0) {
      $("#site-narrative").addClass("alert-danger");
    } else {
      $("#site-narrative").addClass("alert-info");
    }
    
  }).fail(() => {
    $("#site-narrative")
      .removeClass("alert-primary alert-success  alert-info")
      .addClass("alert-danger")
      .text("Couldn't find any sites to load.")
  });
};

function makeSiteObject() {
  let site = {};
  
  site.siteid      = $("#siteSelect").val();
  site.code        = $("#site-code").val();
  site.name        = $("#site-name").val();
  site.address     = $("#site-address").val();
  site.city        = $("#site-city").val();
  site.zip         = $("#site-zip").val();
  site.description = $("#site-description").val();
  
  return site;
}

function clickNewSiteButton() {
  $("#site-code").val("");
  $("#site-name").val("");
  $("#site-address").val("");
  $("#site-city").val("");
  $("#site-zip").val("");
  $("#site-description").val("");
  $("#siteFieldset").prop('disabled', false);
  $("#site-narrative")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text("Fill in the values below to create a new site.")
  
  $("#site-edit")
    .prop('disabled', true)
    .off('click');
  $("#site-update")
    .prop('disabled', true)
    .off('click');
  
  $("#site-selectHeader").addClass("d-none");
  
  $("#site-new")
    .text("Create")
    .off("click")
    .on("click", function() {
        clickCreateSiteButton();
    });
  
  $("#site-cancel")
    .prop('disabled', false)
    .off('click')
    .on('click', function() { cancelNewSite() });
}

function clickCreateSiteButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Create a new site?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .text('Create')
    .on('click', function() { createNewSite() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
}

function createNewSite() {
  let site = makeSiteObject();
  console.log(site);
  $.ajax({
    url: 'http://localhost:3000/api/v1/site',
    contentType: 'application/json',
    method: 'POST',
    data: JSON.stringify(site),
    dataType: 'json',
    timeout: 3000,
  }).done(function(data) {
    //console.log(data);
    $("#updateAlert")
      .removeClass("alert-primary alert-danger alert-info")
      .addClass("alert-success")
      .text("Successfully added new site.");
    cancelNewSite();
    
    loadSiteList(data);
    
  }).fail(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-success alert-info")
      .addClass("alert-danger")
      .text("Could not insert new site; check your data.");
  }).always(function() {
    $("#updateDataButton")
      .off('click')
      .prop('disabled', true);
    $("#updateDataCloseButton")
      .text("Close")
  });
}

function cancelNewSite() {
    $('#site-selectHeader').removeClass('d-none');
    disableEditsite();
    $("#siteSelect").change();
    $("#site-cancel").prop('disabled', true);
    $("#site-edit")
      .prop('disabled', false)
      .off('click')
      .on('click', function() { editSite() });
    $("#site-new")
      .text("New")
      .off('click')
      .on('click', function() { clickNewSiteButton(); });
    $("#site-narrative")
      .removeClass("alert-primary alert-success alert-danger")
      .addClass("alert-info")
      .text("Review or edit sites.")
}
