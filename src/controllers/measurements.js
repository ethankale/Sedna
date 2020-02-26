
"use strict";

var Connection = require('tedious').Connection;
const mssql_config = require('./config.js')

var executeStatement = require('./sqlexecutefunction.js')

let controller = {
    getMeasurements: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        var siteid   = req.query.siteid;
        var paramid  = req.query.paramid;
        var startdtm = req.query.startdtm;
        var enddtm   = req.query.enddtm;
        
        var statement = `SELECT ms.CollectedDtm, ms.Value, md.ParameterID
            FROM Measurement as ms
            LEFT JOIN Metadata as md
            on ms.MetadataID = md.MetadataID
            LEFT JOIN SamplePoint as sp
            on sp.SamplePointID = md.SamplePointID
            WHERE sp.SiteID = ${siteid}
            AND md.ParameterID = ${paramid}
            AND ms.CollectedDtm > '${startdtm}'
            AND ms.CollectedDtm < '${enddtm}'
            ORDER BY CollectedDtm ASC`;
        
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