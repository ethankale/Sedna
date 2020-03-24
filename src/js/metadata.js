
var alqwuutils = require('./utils.js');
var utcoffset = 8;

$(document).ready(function() {
  
  $("#dr-samplePoint").select2({disabled: true});
  loadSamplePointList();
  
  $("#dr-parameter").select2({disabled: true});
  loadParameterList();
  
  $("#dr-method").select2({disabled: true});
  loadMethodList();
  
  $("#dr-unit").select2({disabled: true});
  loadUnitList();
  
  $("#metadataSelect").select2();
  $("#metadataSelect").change(function() {
    disableEditDataRecord();
    let metaid = $("#metadataSelect :selected").val()
    fillMetadataDetails(metaid);
  });
  
  $("#dr-edit").click(function() {
    editDataRecord();
  });
  
  loadMetadataList(1);
});

function loadMetadataList(active) {
  let requestParams = '';
  if (active != 0) {
    requestParams = '?active=1';
  };
  
  $.ajax({url: `http://localhost:3000/api/v1/metadataList${requestParams}`
  }).done(function(data) {
    let options = '';
    
    data.forEach(metadata => {
      options += `<option 
        value=${metadata.MetadataID}>
        ${metadata.Metaname}
        </option>`
    });
    
    $('#metadataSelect').empty().append(options);
    $("#metadataSelect").change();
  });
}

function fillMetadataDetails(metaid) {
  $.ajax({url: `http://localhost:3000/api/v1/metadataDetails?metadataid=${metaid}&utcoffset=${utcoffset}`
    }).done(function(data) {
      
      let spID     = data[0].SamplePointID;
      let prID     = data[0].ParameterID;
      let mtID     = data[0].MethodID;
      let utID     = data[0].UnitID;
      let freq     = data[0].FrequencyMinutes;
      let decimals = data[0].DecimalPoints;
      let active   = data[0].Active;
      let notes    = data[0].Notes;
      
      let mindate  = new Date(data[0].MinDate);
      let maxdate  = new Date(data[0].MaxDate);
      let nmeasure = data[0].MeasurementCount;
      
      $("#dr-samplePoint").val(spID);
      $("#dr-samplePoint").change();
      
      $("#dr-parameter").val(prID);
      $("#dr-parameter").change();
      
      $("#dr-method").val(mtID);
      $("#dr-method").change();
      
      $("#dr-unit").val(utID);
      $("#dr-unit").change();
      
      $("#dr-frequency").val(freq);
      $("#dr-decimalpoints").val(decimals);
      $("#dr-active").prop('checked', active);
      $("#dr-notes").val(notes);
      
      $("#dr-narrative").html(`This data record has <strong>${nmeasure}</strong> 
        measurements between <strong>${mindate.toDateString()}</strong> 
        and <strong>${maxdate.toDateString()}</strong>.`)
      
    });
};

function loadSamplePointList() {
  $.ajax({url: 'http://localhost:3000/api/v1/samplePointList'
  }).done(function(data){
    let options = '';
    
    data.forEach(sp => {
      options += `<option 
        value=${sp.SamplePointID}>
        ${sp.Name}
        </option>`
    });
    
    $('#dr-samplePoint').empty().append(options);
  });
};

function loadParameterList() {
  $.ajax({url: 'http://localhost:3000/api/v1/parameterList'
  }).done(function(data){
    let options = '';
    
    data.forEach(param => {
      options += `<option 
        value=${param.ParameterID}>
        ${param.Name}
        </option>`
    });
    
    $('#dr-parameter').empty().append(options);
  });
};

function loadMethodList() {
  $.ajax({url: 'http://localhost:3000/api/v1/methodList'
  }).done(function(data){
    let options = '';
    
    data.forEach(method => {
      options += `<option 
        value=${method.MethodID}>
        ${method.Name}
        </option>`
    });
    
    $('#dr-method').empty().append(options);
  });
};

function loadUnitList() {
  $.ajax({url: 'http://localhost:3000/api/v1/unitList'
  }).done(function(data){
    let options = '';
    
    data.forEach(unit => {
      options += `<option 
        value=${unit.UnitID}>
        ${unit.Symbol}
        </option>`
    });
    
    $('#dr-unit').empty().append(options);
  });
};

function editDataRecord() {
  $("#dr-samplePoint").prop('disabled', false);
  $("#dr-parameter").prop('disabled', false);
  $("#dr-method").prop('disabled', false);
  $("#dr-unit").prop('disabled', false);
  $("#dataRecordFieldset").prop('disabled', false);
  $("#dr-edit")
    .text("Lock")
    .off('click')
    .on('click', function() {disableEditDataRecord()});
  $("#dr-update")
    .prop('disabled', false)
    .on('click', function() { clickDRUpdateButton() });
}

function disableEditDataRecord() {
  $("#dr-samplePoint").prop('disabled', true);
  $("#dr-parameter").prop('disabled', true);
  $("#dr-method").prop('disabled', true);
  $("#dr-unit").prop('disabled', true);
  $("#dataRecordFieldset").prop('disabled', true);
  $("#dr-edit")
    .text("Edit")
    .off('click')
    .on('click', function() { editDataRecord() });
  $("#dr-update")
    .prop('disabled', true)
    .off('click');
}

function clickDRUpdateButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Update the currently selected data?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .on('click', function() { updateDataRecord() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
};

function updateDataRecord() {
  let drUpdate = {};
  
  drUpdate.metadataID    = $("#metadataSelect").val();
  drUpdate.samplePointID = $("#dr-samplePoint").val();
  drUpdate.parameterID   = $("#dr-parameter").val();
  drUpdate.methodID      = $("#dr-method").val();
  drUpdate.unitID        = $("#dr-unit").val();
  drUpdate.frequency     = $("#dr-frequency").val();
  drUpdate.decimals      = $("#dr-decimalpoints").val();
  drUpdate.active        = $("#dr-active").prop('checked');
  drUpdate.notes         = $("#dr-notes").val();
  
  console.log(JSON.stringify(drUpdate));
  
  $.ajax({
    url: 'http://localhost:3000/api/v1/metadata',
    contentType: 'application/json',
    method: 'PUT',
    data: JSON.stringify(drUpdate),
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

