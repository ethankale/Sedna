
var Request = require('tedious').Request;
var returndata = []

const executeStatement = function(statement, connection, res) {
  var request = new Request(statement, function(err, rowCount) {
    if (err) {
      console.log(err);
    } else {
      console.log(rowCount + ' rows');
    }
    connection.close();
  });
  
  request.on('row', function(columns) {
      var thisrow = {}
      columns.forEach(function(column) {
          thisrow[[column.metadata.colName]] = column.value;
      });
      returndata.push(thisrow);
  });
  
  request.on('done', function(rowCount, more) {
    console.log(rowCount + ' rows returned');
  });
  
  request.on('requestCompleted', function(rowCounty, more, rows) {
    res.json(returndata);
    returndata = [];
  });
  
  connection.execSql(request);
}

//const insertRow


module.exports.executeSelect = executeStatement;