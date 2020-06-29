
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
        
        var spID      = req.query.spID;
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
          WHERE md.SamplePointID = ${spID}
          AND md.ParameterID     = ${paramid}
          AND md.MethodID        = ${methodid}
          AND ms.CollectedDateTime > DATEADD(hour, ${utcoffset}, '${startdtm}')
          AND ms.CollectedDateTime < DATEADD(hour, ${utcoffset}, '${enddtm}')
          ORDER BY CollectedDateTime ASC`;
        
        // console.log(statement);
        
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
      
      // console.log(req.query);
      
      let spID      = req.query.spID;
      let paramid   = req.query.paramid;
      let methodid  = req.query.methodid;
      let startdate = req.query.startdate;
      let enddate   = req.query.enddate;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err);
          res.status(400).json(err);
        } else {
          let statement = `
            with q as
            (
              SELECT CollectedDate, Value, Value * PI()/180. as radians
              FROM Measurement as ms
              WHERE ms.MetadataID IN (
                SELECT MetadataID
                FROM Metadata as md
                WHERE md.SamplePointID = @spID
                AND md.ParameterID = @paramid
                AND md.MethodID = @methodid
                )
                AND ms.CollectedDate >= @startdate
                AND ms.CollectedDate <= @enddate
            ), q2 as
            (
              select 
                CollectedDate, 
                min(Value) as ValueMin,  
                max(Value) as ValueMax,
                sum(Value) as ValueSum,
                avg(Value) as Value,
                avg(sin(radians)) as x, 
                avg(cos(radians)) as y
              from q
              group by CollectedDate
            ), q3 as
            (
            select CollectedDate, ValueMin, ValueMax, ValueSum, Value,
              case 
                when x>=0 and y>=0 then 0 + atan(x/y) --NE quadrant
                when x>=0 and y<0  then Pi() - atan(x/-y)  --SE quadrant
                when x<0  and y<0  then Pi() + atan(-x/-y) --SW quadrant
                when x<0  and y>=0 then  2*PI() - atan(-x/y)  
              end AS avgRadians --NW quadrant
            from q2
            )
            select CollectedDate, ValueMin, ValueMax, ValueSum, Value,
              avgRadians * 180./PI() as ValueDegrees
            from q3
            ORDER BY CollectedDate ASC`
          
          let request = new Request(statement, function(err, rowCount) {
            if (err) {
              console.log(err);
              res.status(400).json(err);
            } else {
              res.status(200).json(returndata);
            }
          });
          
          request.addParameter('spID',       TYPES.Int, spID);
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
        
        let spID      = req.query.spID;
        let paramids  = req.query.paramids;
        let methodids = req.query.methodids;
        
        let returndata = [];
        let connection = new Connection(mssql_config);
        
        // These strings are assumed to be ISO compliant, with the correct UTC offset.
        let startdtm  = lx.DateTime
              .fromISO(req.query.startdtm)
              .toJSDate();
        let enddtm    = lx.DateTime
              .fromISO(req.query.enddtm)
              .toJSDate();
        
        // console.log("startdtm = " + startdtm + "; enddtm = " + enddtm);
        
        let paramstring  = Array.isArray(paramids)  ? paramstring  = paramids.join(", ")  : paramids
        let methodstring = Array.isArray(methodids) ? methodstring = methodids.join(", ") : methodids
        
      connection.on('connect', function(err) {
        let returndata = [];
        let statement = `SELECT 
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
          WHERE md.SamplePointID = @spID
            AND md.ParameterID IN (${paramstring})
            AND md.MethodID IN  (${methodstring})
            AND ms.CollectedDateTime >= @startdtm
            AND ms.CollectedDateTime <= @enddtm
          ORDER BY CollectedDateTime ASC`;
        
        let request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returndata);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          let temprow = {};
          columns.forEach(function(column) {
              temprow[[column.metadata.colName]] = column.value;
          });
          returndata.push(temprow);
        });
        
        request.addParameter('startdtm', TYPES.DateTimeOffset, startdtm);
        request.addParameter('enddtm',   TYPES.DateTimeOffset, enddtm);
        request.addParameter('spID',     TYPES.Int,            spID);
        
        connection.execSql(request);
      });
    },
    
    addMeasurements: function (req, res) {
        
        if (Object.keys(req.body).length === 0) {
          res.status(400).json("No data sent.  ");
          return;
        }
        
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
              console.log(err.number);
              if (err.number == 2601) {
                res.status(409).json("One or more records for that data record and date/time already exist.");
              } else {
                res.status(400).json("Could not load data.  " + err);
              };
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
          
          let errorMsg = '';
          
          measurements.forEach( (measurement, index) => {
            
            let measurement_new = {};
            let val = null;
            if (measurement.Value != null && measurement.Value != '') {
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
            
            if (isNaN(measurement_new.CollectedDTM) || measurement_new.CollectedDTM == null) {
              errorMsg += ('Bad date in measurement #' + index + '; ')
            } else {
              bulkLoad.addRow(measurement_new);
            };
          });
          
          console.log(errorMsg);
          
          if (errorMsg.length > 0) {
            res.status(400).json(errorMsg);
          } else {
            bulkConnection.execBulkLoad(bulkLoad);
          };
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