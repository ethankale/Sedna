"use strict";
let controller = {
    getData: function (req, res) {
        
        var Connection = require('tedious').Connection;
        var Request = require('tedious').Request;
        const mssql_config = require('./config.js')
        
        var returndata = []
        var connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            executeStatement();
          }
        });
        
        function executeStatement() {
          var request = new Request("SELECT SiteID, Code, Name FROM Alqwu.dbo.Site", function(err, rowCount) {
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
            console.log('requestCompleted triggered');
            res.json(returndata);
          });
          
          connection.execSql(request);
        }
    }
};

module.exports = controller;