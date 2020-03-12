
"use strict";

var Connection = require('tedious').Connection;
const mssql_config = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getMeasurements: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        //console.log(req.query);
        
        var siteid    = req.query.siteid;
        var paramid   = req.query.paramid;
        var methodid  = req.query.methodid;
        var startdtm  = req.query.startdtm;
        var enddtm    = req.query.enddtm;
        var utcoffset = req.query.utcoffset;
        
        var statement = `SELECT 
            DATEADD(hour, ${utcoffset}, ms.CollectedDtm) as CollectedDtm,
            ms.Value, md.ParameterID
            FROM Measurement as ms
            LEFT JOIN Metadata as md
            on ms.MetadataID = md.MetadataID
            LEFT JOIN SamplePoint as sp
            on sp.SamplePointID = md.SamplePointID
            WHERE sp.SiteID = ${siteid}
            AND md.ParameterID = ${paramid}
            AND md.MethodID = ${methodid}
            AND ms.CollectedDtm > DATEADD(hour, ${utcoffset}, '${startdtm}')
            AND ms.CollectedDtm < DATEADD(hour, ${utcoffset}, '${enddtm}')
            ORDER BY CollectedDtm ASC`;
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    getDetails: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        //console.log(req.query);
        
        var siteid    = req.query.siteid;
        var paramids  = req.query.paramids;
        var methodids = req.query.methodids;
        var startdtm  = req.query.startdtm;
        var enddtm    = req.query.enddtm;
        var utcoffset = req.query.utcoffset;
        
        var paramstring  = Array.isArray(paramids)  ? paramstring  = paramids.join(", ")  : paramids
        var methodstring = Array.isArray(methodids) ? methodstring = methodids.join(", ") : methodids
        
        var statement = `SELECT 
            DATEADD(hour, ${utcoffset}, ms.CollectedDtm) as CollectedDtm,
            ms.Value, sp.Name as SamplePoint, sp.Latitude, sp.Longitude,
            pm.Name as Parameter, mt.Code as Method
            FROM Measurement as ms
            LEFT JOIN Metadata as md
            ON ms.MetadataID = md.MetadataID
            LEFT JOIN SamplePoint as sp
            ON sp.SamplePointID = md.SamplePointID
            LEFT JOIN Parameter as pm
            ON pm.ParameterID = md.ParameterID
            LEFT JOIN Method as mt
            ON mt.MethodID = md.MethodID
            WHERE sp.SiteID = ${siteid}
            AND md.ParameterID IN (${paramstring})
            AND md.MethodID IN  (${methodstring})
            AND ms.CollectedDtm >= DATEADD(hour, ${utcoffset*-1}, '${startdtm}')
            AND ms.CollectedDtm <= DATEADD(hour, ${utcoffset*-1}, '${enddtm}')
            ORDER BY CollectedDtm ASC`;
        
        
        console.log(statement);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    addMeasurements: function (req, res) {
        //console.log(req.query);
        console.log(req.body);
        res.json("Success");
    }
};

module.exports = controller;