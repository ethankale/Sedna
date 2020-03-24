"use strict";

var Connection = require('tedious').Connection;
var TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;
const mssql_config = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    
    getMetadataList: function (req, res) {
        var connection = new Connection(mssql_config);
        
        var active    = req.query.active;
        
        var statement = `SELECT md.MetadataID, st.Code + ': ' + st.Name + 
          ' (' + pm.Name + ' | ' + mt.Code + ' | ' + sp.Name + ')' as Metaname
          FROM Metadata as md
          INNER JOIN SamplePoint as sp
          ON md.SamplePointID = sp.SamplePointID
          INNER JOIN Site as st
          ON sp.SiteID = st.SiteID
          INNER JOIN Parameter as pm
          ON pm.ParameterID = md.ParameterID
          INNER JOIN Method as mt
          ON mt.MethodID = md.MethodID\r`
          
        if (typeof active != "undefined") {
          statement = statement + " WHERE Active <> 0\r"
        }
        
        statement = statement + " ORDER BY st.Code"
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    getMetadataDetails: function (req, res) {
        var connection = new Connection(mssql_config);
        
        var metaid    = req.query.metadataid;
        var utcoffset = req.query.utcoffset;
        
        var statement = `SELECT COUNT(ms.MeasurementID) as MeasurementCount,
          DATEADD(hour, ${utcoffset}*-1, MIN(ms.CollectedDtm)) as MinDate, 
          DATEADD(hour, ${utcoffset}*-1, MAX(ms.CollectedDtm)) as MaxDate,
          md.[MetadataID]
          ,[ParameterID]
          ,[UnitID]
          ,[SamplePointID]
          ,[Notes]
          ,[MethodID]
          ,[Active]
          ,[FrequencyMinutes]
          ,[DecimalPoints]
          FROM Metadata as md
          INNER JOIN Measurement as ms
          on md.MetadataID = ms.MetadataID
          WHERE md.MetadataID = ${metaid}
          GROUP BY md.MetadataID, md.ParameterID, md.UnitID, md.SamplePointID, 
            md.Notes, md.MethodID, md.Active, md.FrequencyMinutes, md.DecimalPoints`
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
            res.json("Error executing SQL statement; check your parameters.")
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    updateMetadata: function (req, res) {
      let connection     = new Connection(mssql_config);
      
      connection.on('connect', function(err) {
        
        let active = req.body.active ? 1 : 0;
        
        let statement = `UPDATE Metadata
          SET SamplePointID = ${req.body.samplePointID},
            ParameterID = ${req.body.parameterID},
            MethodID = ${req.body.methodID},
            UnitID = ${req.body.unitID},
            FrequencyMinutes = ${req.body.frequency},
            DecimalPoints = ${req.body.decimals},
            Active = ${active},
            Notes = '${req.body.notes}'
          WHERE metadataID = ${req.body.metadataID}`
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json("Success");
          }
          connection.close();
        });
        
        connection.execSql(request);
        
        //console.log(statement);
      });
    },
    
    addMetadata: function (req, res) {
      
    }
};




module.exports = controller;