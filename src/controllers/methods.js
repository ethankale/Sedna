"use strict";

var Connection = require('tedious').Connection;
const mssql_config = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getMethodList: function (req, res) {
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT MethodID, Code + ': ' + Description as Name
      FROM Method
      ORDER BY Code ASC`
    
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