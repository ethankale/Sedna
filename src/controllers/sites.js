"use strict";
let controller = {
    getData: function (req, res) {
        
        var Connection = require('tedious').Connection;
        const mssql_config = require('./config.js')
        
        var executeStatement = require('./sqlexecutefunction.js')
        
        var returndata = []
        var connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            executeStatement("SELECT SiteID, Code, Name FROM Alqwu.dbo.Site", connection, res);
          }
        });
    }
};

module.exports = controller;