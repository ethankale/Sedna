
"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getMeasurements: function (req, res) {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
        var returndata = [];
        var connection = new Connection(mssql_config);
        
        var siteid    = req.query.siteid;
        var paramid   = req.query.paramid;
        var methodid  = req.query.methodid;
        var startdtm  = req.query.startdtm;
        var enddtm    = req.query.enddtm;
        var utcoffset = req.query.utcoffset;
        
        var statement = `SELECT 
            CollectedDateTime, ms.Value, md.ParameterID
          FROM Measurement as ms
          LEFT JOIN Metadata as md
            on ms.MetadataID = md.MetadataID
          LEFT JOIN SamplePoint as sp
            on sp.SamplePointID = md.SamplePointID
          WHERE sp.SiteID = ${siteid}
          AND md.ParameterID = ${paramid}
          AND md.MethodID = ${methodid}
          AND ms.CollectedDateTime > DATEADD(hour, ${utcoffset}, '${startdtm}')
          AND ms.CollectedDateTime < DATEADD(hour, ${utcoffset}, '${enddtm}')
          ORDER BY CollectedDateTime ASC`;
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    getCountByDtmAndMetaid: function(req, res) {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
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
          AND CollectedDateTime >= '${startdtm}'
          AND CollectedDateTime <= '${enddtm}'`;
        
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
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
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
            CollectedDateTime,
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
            AND ms.CollectedDateTime >= '${startdtm}'
            AND ms.CollectedDateTime <= '${enddtm}'
          ORDER BY CollectedDateTime ASC`;
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    addMeasurements: function (req, res) {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
        
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
              console.log("Could not run the bulk load for measurements.  " + err);
              //throw err;
              res.status(400).json("Could not load data.  " + err);
            } else {
              res.status(200).json("Success");
            };
            //console.log('inserted %d rows', isNaN(rowCount) ? 0 : rowCount);
            bulkConnection.close();
          });
          
          bulkLoad.addColumn('CollectedDateTime', TYPES.DateTimeOffset, { nullable: false, scale: 0 });
          bulkLoad.addColumn('Value',             TYPES.Numeric, { nullable: true, precision: 18, scale: 6 });
          bulkLoad.addColumn('MetadataID',        TYPES.Int, { nullable: false });
          
          measurements.forEach( (measurement, index) => {
            let measurement_new = {};
            measurement_new.CollectedDateTime = new Date(measurement.dtm);
            measurement_new.Value             = Math.round(measurement.Value*multiplier)/multiplier;
            measurement_new.MetadataID        = parseInt(metaid);
            
            bulkLoad.addRow(measurement_new);
            
          });
          bulkConnection.execBulkLoad(bulkLoad);
          //console.log("Loaded #" + req.body.loadnumber);
        };
        
        bulkConnection.on('connect', function(err) {
          if (err) {
            console.log('Bulk connection failed.');
            res.status(400).end();
          }
          callbackBus.bulkConnected = true;
          callbackBus.loadMeasurement;
        });
        
        connection.on('connect', function(err_conn) {
          if (err_conn) {
              res.status(400).json("Error: " + err_conn);
          } else {
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
    },
    
    deleteMeasurements: function(req, res) {
      if (typeof req.body.MetadataID != 'undefined') {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
        let connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          
          let statement = `DELETE Measurement 
           WHERE MetadataID = @MetadataID
           AND CollectedDateTime >= @MinDtm
           AND CollectedDateTime <= @MaxDtm`
          
           var request = new Request(statement, function(err, rowCount) {
             if (err) {
               res.status(400).end();
               console.log(err);
             } else {
               res.status(200).json("Successfully deleted " + rowCount + " rows.");
             }
             connection.close();
           });
          
          request.addParameter('MetadataID', TYPES.Int, req.body.MetadataID);
          request.addParameter('MinDtm',    TYPES.DateTimeOffset, req.body.MinDtm);
          request.addParameter('MaxDtm',    TYPES.DateTimeOffset, req.body.MaxDtm);
          
          connection.execSql(request);
        });
      } else {
        res.status(400).json('Must provide a MetadataID to delete measurements.');
      };
    }
};

module.exports = controller;