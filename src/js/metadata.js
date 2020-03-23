
var alqwuutils = require('./utils.js');

$(document).ready(function() {
  
  $("#dr-samplePoint").select2();
  loadSamplePointList();
  
  $("#dr-parameter").select2();
  loadParameterList();
  
  $("#dr-method").select2();
  loadMethodList();
  
  $("#dr-unit").select2();
  loadUnitList();
  
  $("#metadataSelect").select2();
  $("#metadataSelect").change(function() {
    let metaid = $("#metadataSelect :selected").val()
    fillMetadataDetails(metaid);
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
  $.ajax({url: `http://localhost:3000/api/v1/metadataDetails?metadataid=${metaid}`
    }).done(function(data) {
      console.log(data);
      
      let spID     = data[0].SamplePointID;
      let prID     = data[0].ParameterID;
      let mtID     = data[0].MethodID;
      let utID     = data[0].UnitID;
      let freq     = data[0].FrequencyMinutes;
      let decimals = data[0].DecimalPoints;
      let active   = data[0].Active;
      
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

