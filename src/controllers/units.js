"use strict";

var Connection = require('tedious').Connection;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getUnitList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT UnitID, Symbol
      FROM Unit
      ORDER BY Symbol ASC`
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  }
  
};

module.exports = controller;