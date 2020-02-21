"use strict";
let controller = {
    getData: function (req, res) {
        
        var Connection = require('tedious').Connection;
        var Request = require('tedious').Request;
        const mssql_config = require('./config.js')
        
        var connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            executeStatement();
          }
        });
        
        function executeStatement() {
          var request = new Request("SELECT COUNT(*) FROM Alqwu.dbo.Metadata", function(err, rowCount) {
            if (err) {
              console.log(err);
            } else {
              console.log(rowCount + ' rows');
            }
            connection.close();
          });

          request.on('row', function(columns) {
            columns.forEach(function(column) {
              if (column.value === null) {
                console.log('NULL');
              } else {
                console.log(column.value);
                res.json({'value': column.value});
              }
            });
          });

          request.on('done', function(rowCount, more) {
            console.log(rowCount + ' rows returned');
          });

          // In SQL Server 2000 you may need: connection.execSqlBatch(request);
          connection.execSql(request);
        }
    }
};

module.exports = controller;