
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
        
        var statement = `SELECT DISTINCT p.ParameterID, p.Name
            FROM Metadata as m
            LEFT JOIN Parameter as p
            ON m.ParameterID = p.ParameterID
            LEFT JOIN SamplePoint as sp
            ON sp.SamplePointID = m.SamplePointID
            WHERE sp.SiteID = ${req.query.siteid}
            ORDER BY p.Name`;
        
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