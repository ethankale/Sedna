
"use strict";

var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
const mssql_config = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getMeasurements: function (req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
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
    
    getCountByDtmAndMetaid: function(req, res) {
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        var metaid    = req.query.metaid;
        var startdtm  = req.query.startdtm;
        var enddtm    = req.query.enddtm;
        var utcoffset = req.query.utcoffset;
        
        var statement = `SELECT 
          COUNT(MeasurementID) as measurementCount
          FROM Measurement
          WHERE MetadataID = ${metaid}
          AND CollectedDtm >= DATEADD(hour, ${utcoffset}, '${startdtm}')
          AND CollectedDtm <= DATEADD(hour, ${utcoffset}, '${enddtm}')`;
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
            res.json(err);
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
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    addMeasurements: function (req, res) {
        //console.log("Starting #" + req.body.loadnumber);
        
        let connection     = new Connection(mssql_config);
        let bulkConnection = new Connection(mssql_config);
        let decimals       = 3;
        let multiplier     = 10;
        
        const callbackBus    = {
            requestComplete: false,
            bulkConnected: false,
            get loadMeasurement() {
                if(this.requestComplete & this.bulkConnected) {
                    loadBulkMeasurements(multiplier, req.body.metaid, req.body.measurements);
                    //return req.body.measurements;
                } else {
                    //return "Waiting for request or bulk connect, or both";
                }
            }
        };
        
        let loadBulkMeasurements = function(multiplier, metaid, measurements) {
          let options = { keepNulls: true };
          let bulkLoad = bulkConnection.newBulkLoad('Measurement', options, function (err, rowCount) {
            if (err) {
                console.log("Could not run the bulk load for measurements.");
                throw err;
            };
            //console.log('inserted %d rows', isNaN(rowCount) ? 0 : rowCount);
            bulkConnection.close();
          });
          bulkLoad.addColumn('CollectedDtm', TYPES.DateTime2, { nullable: false });
          bulkLoad.addColumn('Value', TYPES.Numeric, { nullable: true, precision: 18, scale: 6 });
          bulkLoad.addColumn('MetadataID', TYPES.Int, { nullable: false });
          
          let measurements_toload = [];
          
          measurements.forEach( (measurement, index) => {
            let measurement_new = {};
            
            measurement_new.CollectedDtm = new Date(measurement.dtm);
            measurement_new.Value        = Math.round(measurement.Value*multiplier)/multiplier;
            measurement_new.MetadataID   = parseInt(metaid);
            
            measurements_toload.push(measurement_new);
            bulkLoad.addRow(measurement_new);
            
          });
          bulkConnection.execBulkLoad(bulkLoad);
          //console.log("Loaded #" + req.body.loadnumber);
          res.json("Success");
        };
        
        bulkConnection.on('connect', function(err) {
          if (err) {
              console.log('Bulk connection failed.');
              throw err;
          }
          callbackBus.bulkConnected = true;
          //console.log("Bulk connection for #" + req.body.loadnumber);
          
          //console.log(callbackBus.loadMeasurement);
          callbackBus.loadMeasurement;
        });
        
        connection.on('connect', function(err_conn) {
          if (err_conn) {
              res.json("Error: " + err_conn);
          } else {
            let Request = require('tedious').Request;
            let statement = "SELECT DecimalPoints FROM Metadata WHERE MetadataID = " + req.body.metaid;
            
            let request = new Request(statement, function(err, rowCount, rows) {
              if (err) {
                console.log(err);
                res.json("Error: " + err);
              } else {
                callbackBus.requestComplete = true;
                //console.log("Got metaid for #" + req.body.loadnumber);
                
                //console.log(callbackBus.loadMeasurement);
                callbackBus.loadMeasurement;
              }
              connection.close();
            });
            
            request.on('row', function(columns) {
                columns.forEach(function(column) {
                    decimals   = column.value;
                    multiplier = 10**decimals;
                });
            });
            

            
            connection.execSql(request);
          }
        });

    }
};

module.exports = controller;