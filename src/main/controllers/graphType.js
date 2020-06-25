"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

let controller = {
  getGraphTypeList: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        
        let returnval = [];
        
        let statement = `SELECT GraphTypeID, Name, Description
          FROM GraphType`
          
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returnval);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          let temprow = {};
          columns.forEach(function(column) {
              temprow[[column.metadata.colName]] = column.value;
          });
          returnval.push(temprow);
        });
        
        connection.execSql(request);
      };
    });
  }
};

module.exports = controller;