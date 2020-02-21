
var apiTest = function() {
    return $.ajax({url: "http://localhost:3000/api/v1/getSites"});
}


// apiTest().done(function(data) {console.log(data.recordset[0])});