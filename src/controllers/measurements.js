
"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');
let lx  = require('luxon');

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
            CollectedDateTime, ms.Value, ms.Depth_M, md.ParameterID
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
    
    getDailyMeasurements: function(req, res) {
      let cfg = require('./config.js')
      let mssql_config = cfg.getConfig().mssql;
      var returndata = [];
      var connection = new Connection(mssql_config);
      
      let siteid    = req.query.siteid;
      let paramid   = req.query.paramid;
      let methodid  = req.query.methodid;
      let startdate = req.query.startdate;
      let enddate   = req.query.enddate;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err);
          res.status(400).json(err);
        } else {
          // Note that this query uses an index hint.  This is SUPER IMPORTANT.
          //   Without the hint this query takes several seconds to run.
          let statement = `SELECT CollectedDate, 
              min(Value) as ValueMin, max(Value) as ValueMax, avg(Value) as Value
            FROM Measurement as ms
              WITH (INDEX(measurement_metadataid_idx))
            WHERE ms.MetadataID IN (
              SELECT MetadataID
              FROM Metadata as md
              LEFT JOIN SamplePoint as sp
                on sp.SamplePointID = md.SamplePointID
              WHERE sp.SiteID = @siteid
                AND md.ParameterID = @paramid
                AND md.MethodID = @methodid
              )
              AND ms.CollectedDate >= @startdate
              AND ms.CollectedDate <= @enddate
              GROUP BY CollectedDate
              ORDER BY CollectedDate ASC`
          
          let request = new Request(statement, function(err, rowCount) {
            if (err) {
              console.log(err);
              res.status(400).json(err);
            } else {
              res.status(200).json(returndata);
            }
          });
          
          request.addParameter('siteid',     TYPES.Int, siteid);
          request.addParameter('paramid',    TYPES.Int, paramid);
          request.addParameter('methodid',   TYPES.Int, methodid);
          request.addParameter('startdate',  TYPES.Date, startdate);
          request.addParameter('enddate',    TYPES.Date, enddate);
          
          request.on('row', function(columns) {
            let newrow = {};
            columns.forEach((column) => {
              newrow[[column.metadata.colName]] = column.value;
            });
            returndata.push(newrow);
          });
          
          connection.execSql(request);
          
        };
      });
    },
    
    getCountByDtmAndMetaid: function(req, res) {
      let cfg = require('./config.js')
      let mssql_config = cfg.getConfig().mssql;
      var returndata = {};
      var connection = new Connection(mssql_config);
      
      var metaid    = req.query.metaid;
      var startdtm  = req.query.startdtm;
      var enddtm    = req.query.enddtm;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
          res.status(400).json(err);
        } else {
          var statement = `SELECT count(MeasurementID) as measurementCount
          FROM Measurement 
          WHERE MetadataID = @metaid
          AND CollectedDateTime >= @startdtm
          AND CollectedDateTime <= @enddtm`;
          
          let request = new Request(statement, function(err, rowCount) {
            if (err) {
              console.log(err);
              res.status(400).end();
            } else {
              res.status(200).json(returndata);
            }
          });
          
          request.addParameter('metaid',   TYPES.Int, metaid);
          request.addParameter('startdtm', TYPES.DateTime2, startdtm);
          request.addParameter('enddtm',   TYPES.DateTime2, enddtm);
          
          request.on('row', function(columns) {
            columns.forEach((column) => {
              returndata[[column.metadata.colName]] = column.value;
            });
          });
          
          connection.execSql(request);
        };
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
            DATEADD(minute, ms.CollectedDTMOffset, CollectedDateTime) as CollectedDateTime,
            ms.Value, qf.Code as Qualifier, ms.Depth_M as Depth_Meters,
            unit.Symbol as Unit,
            pm.Name as Parameter, mt.Code as Method,
            st.Code as SiteCode, st.Name as SiteName,
            sp.Name as SamplePoint, sp.Latitude, sp.Longitude
          FROM Measurement as ms
            WITH (INDEX(measurement_metadataid_idx))
          LEFT JOIN Metadata as md
            ON ms.MetadataID = md.MetadataID
          LEFT JOIN SamplePoint as sp
            ON sp.SamplePointID = md.SamplePointID
          LEFT JOIN Site as st
            ON st.SiteID = sp.SiteID
          LEFT JOIN Parameter as pm
            ON pm.ParameterID = md.ParameterID
          LEFT JOIN Method as mt
            ON mt.MethodID = md.MethodID
          LEFT JOIN Qualifier as qf
            ON ms.QualifierID = qf.QualifierID
          LEFT JOIN Unit as unit
            ON unit.UnitID = md.UnitID
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
        
        let metaid       = req.body.metaid;
        let offset       = req.body.offset;
        let offsetstring = offset < 0 ? 'UTC' + offset/60 : 'UTC+' + (offset/60);
        let measurements = req.body.measurements;
        
        let connection     = new Connection(mssql_config);
        let bulkConnection = new Connection(mssql_config);
        let decimals       = 3;
        let multiplier     = 10;
        
        const callbackBus    = {
            requestComplete: false,
            bulkConnected: false,
            get loadMeasurement() {
                if(this.requestComplete & this.bulkConnected) {
                    loadBulkMeasurements(multiplier, metaid, offset, measurements);
                    //return req.body.measurements;
                } else {
                    //return "Waiting for request or bulk connect, or both";
                }
            }
        };
        
        let loadBulkMeasurements = function(multiplier, metaid, offset, measurements) {
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
          
          bulkLoad.addColumn('CollectedDTM',         TYPES.DateTime2, { nullable: false, scale: 0 });
          bulkLoad.addColumn('Value',                TYPES.Numeric,   { nullable: true, precision: 18, scale: 6 });
          bulkLoad.addColumn('MetadataID',           TYPES.Int,       { nullable: false });
          bulkLoad.addColumn('CollectedDTMOffset',   TYPES.Int,       { nullable: false });
          bulkLoad.addColumn('MeasurementCommentID', TYPES.Int,       { nullable: true });
          bulkLoad.addColumn('MeasurementQualityID', TYPES.Int,       { nullable: true });
          bulkLoad.addColumn('QualifierID',          TYPES.Int,       { nullable: true });
          bulkLoad.addColumn('Depth_M',              TYPES.Numeric,   { nullable: true, precision: 6, scale: 2 });
          
          measurements.forEach( (measurement, index) => {
            
            let measurement_new = {};
            let val = null;
            if (measurement.Value != null) {
              val = Math.round(measurement.Value*multiplier)/multiplier;
            };
            measurement_new.CollectedDTM = lx.DateTime
              .fromISO(measurement.CollectedDTM)
              .setZone(offsetstring)
              .setZone('UTC', {keepLocalTime: true })
              .toJSDate();
              
            measurement_new.Value                = val;
            measurement_new.MetadataID           = metaid;
            measurement_new.CollectedDTMOffset   = offset;
            measurement_new.MeasurementCommentID = measurement.MeasurementCommentID;
            measurement_new.MeasurementQualityID = measurement.MeasurementQualityID;
            measurement_new.QualifierID          = measurement.QualifierID;
            measurement_new.Depth_M              = measurement.Depth_M;
            
            bulkLoad.addRow(measurement_new);
            // if (index%10 == 0) { console.log(measurement) };
            // if (index%10 == 0) { console.log(measurement_new) };
            
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
      if (typeof req.body.MetadataID == 'undefined') {
        res.status(400).json('Must provide a MetadataID to delete measurements.');
      } else {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
        let connection = new Connection(mssql_config);
        
        let MetadataID = req.body.MetadataID;
        let MinDtm     = req.body.MinDtm;
        let MaxDtm     = req.body.MaxDtm;
        
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
          
          request.addParameter('MetadataID', TYPES.Int,             MetadataID);
          request.addParameter('MinDtm',     TYPES.DateTimeOffset,  MinDtm);
          request.addParameter('MaxDtm',     TYPES.DateTimeOffset,  MaxDtm);
          
          connection.execSql(request);
        });
      };
    }
};

module.exports = controller;