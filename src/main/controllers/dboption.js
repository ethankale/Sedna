"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getOptionList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let options = [];
    
    connection.on('connect', function(err) {
    
      let statement = `SELECT 
      [DBOptionID],
      [Name],
      [ValueInt]
      FROM 
      [Alqwu].[dbo].[DBOption]
      `
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).json(err);
          console.log(err);
        } else {
          res.status(200).json(options);
        }
        connection.close();
      });
      
      request.on('row', function(columns) {
        let thisRow = {};
        columns.forEach(function(column) {
          thisRow[[column.metadata.colName]] = column.value;
        });
        options.push(thisRow);
      });
      
      connection.execSql(request);
    });
  }
  
};

module.exports = controller;