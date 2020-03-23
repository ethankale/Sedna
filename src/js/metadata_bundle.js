(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var alqwuutils = require('./utils.js');

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
  $.ajax({url: `http://localhost:3000/api/v1/metadataDetails?metadataid=${metaid}`
    }).done(function(data) {
      
      let spID     = data[0].SamplePointID;
      let prID     = data[0].ParameterID;
      let mtID     = data[0].MethodID;
      let utID     = data[0].UnitID;
      let freq     = data[0].FrequencyMinutes;
      let decimals = data[0].DecimalPoints;
      let active   = data[0].Active;
      let notes    = data[0].Notes;
      
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
    .on('click', function() { updateDataRecord() });
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
    .on('click', function() {editDataRecord()});
  $("#dr-update")
    .prop('disabled', true)
    .off('click');
}

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
    console.log("Worked!");
  }).fail(function() {
    console.log("Didn't work :(");
  });
  
}


},{"./utils.js":2}],2:[function(require,module,exports){

exports.calcWaterYear = function(dt) {
    var year = dt.getFullYear()
    var mon  = dt.getMonth()
    
    // Zero-indexed months; 8 = September
    return(mon > 8 ? year+1 : year)
}

exports.createWYList = function(startdt, enddt) {
    var startwy = exports.calcWaterYear(startdt)
    var endwy   = exports.calcWaterYear(enddt)
    var wylist  = [];
    var currwy = startwy;
    
    while(currwy <= endwy) {
        wylist.push(currwy);
        currwy = currwy+1;
    };
    return(wylist);
}

exports.formatDateForSQL = function(dt) {
    let months  = dt.getMonth()+1;
    let days    = dt.getDay();
    let hours   = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();
    
    months  = months  < 10 ? '0'+months  : months;
    days    = days    < 10 ? '0'+days    : days;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    
    var strTime = hours + ':' + minutes + ':' + seconds;
    var strDate = dt.getFullYear() + "-" + months + "-" + days;
    return  strDate + " " + strTime;
}

var utcoffset = -8;

exports.utcoffset   = utcoffset;             // Difference between local and UTC
exports.utcoffsetjs = utcoffset*60*60*1000;  // UTC offset in milliseconds

},{}]},{},[1]);
