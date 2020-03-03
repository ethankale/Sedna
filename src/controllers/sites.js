
"use strict";

var Connection = require('tedious').Connection;
const mssql_config = require('./config.js')

var executeStatement = require('./sqlexecutefunction.js')


let controller = {
    getSitesList: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            executeStatement("SELECT SiteID, Code, Name FROM Site", connection, res);
          }
        });
    },
    
    getParamsBySite: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        var statement = `SELECT SiteID, ParameterID, MethodID, Name, Method, maxdtm, mindtm, nmeasure
          FROM [Measurement_By_SamplePoint_v]
          WHERE SiteID = ${req.query.siteid}
          ORDER BY Name`
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            executeStatement(statement, connection, res);
          }
        });
    }
    
};

module.exports = controller;