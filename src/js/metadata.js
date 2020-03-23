
var alqwuutils = require('./utils.js');

$(document).ready(function() {
  $("#metadataSelect").select2();
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
    
  });
}