
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
  
  $("#dr-activeFilterCheck").change(function() {
    let active = $("#dr-activeFilterCheck").prop('checked');
    loadMetadataList(active);
  });
  
  let active = $("#dr-activeFilterCheck").prop('checked');
  loadMetadataList(active);
  
  $("#dr-new").click(function() {
    clickNewDRButton();
  });
});

function loadMetadataList(active) {
  let requestParams = '';
  if (active) {
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
      
      $("#dr-samplePoint").val(spID).change();
      $("#dr-parameter").val(prID).change();
      $("#dr-method").val(mtID).change();
      $("#dr-unit").val(utID).change();
      
      $("#dr-frequency").val(freq);
      $("#dr-decimalpoints").val(decimals);
      $("#dr-active").prop('checked', active);
      $("#dr-notes").val(notes);
      
      let narrative = `This data record has <strong>${nmeasure}</strong> measurements`
      if (nmeasure > 0) {
          narrative +=  ` between <strong>${mindate.toDateString()}</strong> 
            and <strong>${maxdate.toDateString()}</strong>.`;
      } else {
          narrative += ".";
      }
      
      $("#dr-narrative").html(narrative);
      
    });
};

function loadSamplePointList() {
  $.ajax({url: 'http://localhost:3000/api/v1/samplePointList'
  }).done(function(data){
    let options = `<option 
        value=-1>
        None
        </option>`;
    
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
    let options = `<option 
        value=-1>
        None
        </option>`;
    
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
    let options = `<option 
        value=-1>
        None
        </option>`;
    
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
    let options = `<option 
        value=-1>
        None
        </option>`;
    
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
    .text('Update Data')
    .on('click', function() { updateDataRecord() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
};

function makeDRObject() {
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
  
  return drUpdate;
}

function updateDataRecord() {
  let drUpdate = makeDRObject();
  
  //console.log(JSON.stringify(drUpdate));
  
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

function clickNewDRButton() {
  $("#dr-samplePoint")
    .prop('disabled', false)
    .val(-1)
    .change();
  $("#dr-parameter")
    .prop('disabled', false)
    .val(-1)
    .change();
  $("#dr-method")
    .prop('disabled', false)
    .val(-1)
    .change();
  $("#dr-unit")
    .prop('disabled', false)
    .val(-1)
    .change();
  $("#dataRecordFieldset").prop('disabled', false);
  $("#dr-frequency").val(15);
  $("#dr-decimalpoints").val(2);
  $("#dr-notes").val('');
  $("#dr-narrative").text('Fill in the values below to create a new data record.')
  
  $("#dr-edit")
    .prop('disabled', true)
    .off('click');
  $("#dr-update")
    .prop('disabled', true)
    .off('click');
  
  $("#dr-selectHeader").addClass("d-none");
  
  $("#dr-new")
    .text("Create")
    .off("click")
    .on("click", function() {
        clickCreateDRButton();
    });
  
  $("#dr-cancel")
    .prop('disabled', false)
    .off('click')
    .on('click', function() {
        $('#dr-selectHeader').removeClass('d-none');
        disableEditDataRecord();
        $("#metadataSelect").change();
        $("#dr-cancel").prop('disabled', true);
        $("#dr-edit")
          .prop('disabled', false)
          .off('click')
          .on('click', function() { editDataRecord() });
        $("#dr-new")
          .text("New")
          .off('click')
          .on('click', function() {
            clickNewDRButton();
          });
    });
  
}

function clickCreateDRButton() {
  $("#updateAlert")
    .removeClass("alert-primary alert-success alert-danger")
    .addClass("alert-info")
    .text('Create a new data record?')
  $("#updateDataButton")
    .off('click')
    .prop('disabled', false)
    .text('Create')
    .on('click', function() { createNewDR() });
  $("#updateDataCloseButton")
    .text("Cancel")
  $("#updateModal").modal();
}

function createNewDR() {
  let drUpdate = makeDRObject();
  
  //console.log(JSON.stringify(drUpdate));
  
  $.ajax({
    url: 'http://localhost:3000/api/v1/metadata',
    contentType: 'application/json',
    method: 'POST',
    data: JSON.stringify(drUpdate),
    dataType: 'json',
    timeout: 3000,
  }).done(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-danger alert-info")
      .addClass("alert-success")
      .text("Successfully added new data record.");
  }).fail(function() {
    $("#updateAlert")
      .removeClass("alert-primary alert-success alert-info")
      .addClass("alert-danger")
      .text("Could not insert new record; check your data.");
  }).always(function() {
    $("#updateDataButton")
      .off('click')
      .prop('disabled', true);
    $("#updateDataCloseButton")
      .text("Close")
  });
  
}
