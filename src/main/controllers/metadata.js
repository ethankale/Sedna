"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')
let lx  = require('luxon');

const sqlfunctions = require('./sqlexecutefunction.js');

let controller = {
    
    getMetadataList: function (req, res) {
        let mssql_config = cfg.getConfig().mssql;
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
          statement = statement + " WHERE md.Active <> 0\r"
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
    
    getMetadatasBySPParamMethodDate: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var spID        = req.query.spID;
      var ParameterID = req.query.ParameterID;
      var MethodID    = req.query.MethodID;
      
      var hasDates = typeof req.query.MinDate !== "undefined" && 
                     typeof req.query.MaxDate !== "undefined";
      
      // Dates expected in ISO format with time zone
      var MinDate     = "";
      var MaxDate     = "";
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          
          let statement = `
            SELECT md.MetadataID, md.SamplePointID, md.ParameterID, md.MethodID, md.DataStarts, md.DataEnds, 
              COUNT(mt.MeasurementID) as nmeasures, MIN(mt.CollectedDateTime) as mindt, MAX(mt.CollectedDateTime) as maxdt,
              md.CreatedOn, md.FileName
            FROM Metadata as md
            LEFT JOIN Measurement as mt
              ON md.MetadataID = mt.MetadataID
            WHERE SamplePointID = @spID
              AND ParameterID = @ParameterID
              AND MethodID = @MethodID
            GROUP BY md.MetadataID, md.ParameterID, md.MethodID, md.DataStarts, md.DataEnds, md.SamplePointID,
              md.CreatedOn, md.FileName
          `
          if (hasDates) {
            MinDate = req.query.MinDate;
            MaxDate = req.query.MaxDate;
            statement += `
              HAVING NOT (@MinDate > MAX(mt.CollectedDateTime)
                OR @MaxDate < MIN(mt.CollectedDateTime))
            `
          }
          
          statement += `ORDER BY md.MetadataID`;
          
          let returndata = [];
          
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
            let thisrow = {}
            columns.forEach(function(column) {
                thisrow[[column.metadata.colName]] = column.value;
            });
            returndata.push(thisrow);
          });
          
          request.addParameter('spID',        TYPES.Int, spID)
          request.addParameter('ParameterID', TYPES.Int, ParameterID)
          request.addParameter('MethodID',    TYPES.Int, MethodID)
          
          if (hasDates) {
            request.addParameter('MinDate',     TYPES.VarChar, MinDate)
            request.addParameter('MaxDate',     TYPES.VarChar, MaxDate)
          };
          
          connection.execSql(request);
          
        }
      });
    },
    
    getUniqueParamAndMethod: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var spID        = req.query.spID;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          
          let statement = `
            SELECT DISTINCT md.ParameterID, md.MethodID, pm.Name + ' (' + mt.Description + ')' as Name
            FROM Metadata as md
            LEFT JOIN Parameter as pm
              on md.ParameterID = pm.ParameterID
            LEFT JOIN Method as mt
              on md.MethodID = mt.MethodID
            WHERE md.SamplePointID = @spID
          `
          
          let returndata = [];
          
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
            let thisrow = {}
            columns.forEach(function(column) {
                thisrow[[column.metadata.colName]] = column.value;
            });
            returndata.push(thisrow);
          });
          
          request.addParameter('spID', TYPES.Int, spID)
          
          connection.execSql(request);
          
        }
      });
    },
    
    getMetadatasBySamplePoint: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var spID    = req.query.spID;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          
          let statement = `
            SELECT md.MetadataID, md.FileName, sp.SiteID, md.ParameterID, pm.Name as Parameter, 
              md.MethodID, mt.Code as Method, md.UnitID, un.Symbol as Unit, FrequencyMinutes, DecimalPoints,
              md.DataStarts, md.DataEnds, md.CreatedOn, usr.Name as UserName
            FROM Metadata as md
            INNER JOIN SamplePoint as sp
              ON md.SamplePointID = sp.SamplePointID
            INNER JOIN Parameter as pm
              ON pm.ParameterID = md.ParameterID
            INNER JOIN Method as mt
              ON mt.MethodID = md.MethodID
            INNER JOIN Unit as un
              ON un.UnitID = md.UnitID
            LEFT JOIN [User] as usr
              ON usr.UserID = md.UserID 
            WHERE sp.SamplePointID = @spID
              AND md.Active = 1
            ORDER BY md.CreatedOn DESC
          `
          
          let returndata = [];
          
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
            let thisrow = {}
            columns.forEach(function(column) {
                thisrow[[column.metadata.colName]] = column.value;
            });
            returndata.push(thisrow);
          });
          
          request.addParameter('spID', TYPES.Int, spID)
          
          connection.execSql(request);
          
        }
      });
    },
    
    getLatestMetadatasBySamplePoint: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var spID    = req.query.spID;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          
          let statement = `
            SELECT DISTINCT m.SamplePointID, m.ParameterID, m.MethodID, m.UnitID, m3.*,
              pm.Name, mt.Description, un.Symbol
            FROM Alqwu.dbo.Metadata as m
            CROSS APPLY (
              SELECT TOP 1 m2.Active, m2.FrequencyMinutes, m2.DecimalPoints, m2.GraphTypeID,
                m2.FileName, m2.DataStarts, m2.DataEnds, m2.CreatedOn, m2.UserID,
                m2.EquipmentIDLogger, m2.EquipmentIDSensor, m2.Notes
              FROM Alqwu.dbo.Metadata as m2
              WHERE m.SamplePointID = m2.SamplePointID 
                AND m.ParameterID = m2.ParameterID
                AND m.MethodID = m2.MethodID
                AND m.UnitID = m2.UnitID
              ORDER BY DataEnds DESC, CreatedOn DESC
            ) as m3
            INNER JOIN Parameter as pm
                ON m.ParameterID = pm.ParameterID
            INNER JOIN Method as mt
                ON m.MethodID = mt.MethodID
            INNER JOIN Unit as un
                ON m.UnitID = un.UnitID
            WHERE m.SamplePointID = @spID
          `
          
          let returndata = [];
          
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
            let thisrow = {}
            columns.forEach(function(column) {
                thisrow[[column.metadata.colName]] = column.value;
            });
            returndata.push(thisrow);
          });
          
          request.addParameter('spID', TYPES.Int, spID)
          
          connection.execSql(request);
          
        }
      });
    },
    
    getMetadataDetails: function (req, res) {
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        var metaid    = req.query.metadataid;
        var utcoffset = req.query.utcoffset;
        
        if (typeof metaid != 'undefined' && typeof utcoffset != 'undefined') {
            
            var statement = `
              SELECT COUNT(ms.MeasurementID) as MeasurementCount
                ,DATEADD(hour, ${utcoffset}*-1, MIN(ms.CollectedDtm)) as MinDate
                ,DATEADD(hour, ${utcoffset}*-1, MAX(ms.CollectedDtm)) as MaxDate
                ,md.[MetadataID]
                ,[ParameterID]
                ,[UnitID]
                ,[SamplePointID]
                ,[Notes]
                ,[MethodID]
                ,[Active]
                ,[FrequencyMinutes]
                ,[DecimalPoints]
                ,[FileName]
                ,[DataStarts]
                ,[DataEnds]
                ,[UserID]
                ,[CreatedOn]
                ,[EquipmentIDSensor]
                ,[EquipmentIDLogger]
              FROM Metadata as md
              LEFT JOIN Measurement as ms
                on md.MetadataID = ms.MetadataID
              WHERE md.MetadataID = ${metaid}
              GROUP BY md.MetadataID, md.ParameterID, md.UnitID, md.SamplePointID, 
                md.Notes, md.MethodID, md.Active, md.FrequencyMinutes, md.DecimalPoints,
                md.FileName, md.DataStarts, md.DataEnds, md.UserID, md.CreatedOn,
                EquipmentIDSensor, EquipmentIDLogger`
            
            connection.on('connect', function(err) {
              if(err) {
                console.log('Error: ', err)
                res.json("Error executing SQL statement; check your parameters.")
              } else {
                sqlfunctions.executeSelect(statement, connection, res);
              }
            });
        } else {
          res.status(400).json("Must supply both metadataid and utcoffset.");
        }
    },
    
    updateMetadata: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection     = new Connection(mssql_config);
      
      connection.on('connect', function(err) {
        
        let active = req.body.Active;
          
        let statement = `
          UPDATE Metadata SET 
            SamplePointID     = @samplePointID,
            ParameterID       = @parameterID,
            MethodID          = @methodID,
            UnitID            = @unitID,
            FrequencyMinutes  = @frequency,
            DecimalPoints     = @decimals,
            Active            = @active,
            Notes             = @notes,
            GraphTypeID       = @graphTypeID,
            FileName          = @fileName,
            DataStarts        = @dataStarts,
            DataEnds          = @dataEnds,
            UserID            = @userID,
            EquipmentIDSensor = @equipmentIDSensor,
            EquipmentIDLogger = @equipmentIDLogger
          WHERE metadataID = @metadataID
        `
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json("Success");
          }
          connection.close();
        });
        
        request.addParameter('metadataID',        TYPES.Int,       req.body.MetadataID)
        request.addParameter('samplePointID',     TYPES.Int,       req.body.SamplePointID)
        request.addParameter('parameterID',       TYPES.Int,       req.body.ParameterID)
        request.addParameter('methodID',          TYPES.Int,       req.body.MethodID)
        request.addParameter('unitID',            TYPES.Int,       req.body.UnitID)
        request.addParameter('frequency',         TYPES.Int,       req.body.FrequencyMinutes)
        request.addParameter('decimals',          TYPES.Int,       req.body.DecimalPoints)
        request.addParameter('notes',             TYPES.VarChar,   req.body.Notes)
        request.addParameter('active',            TYPES.Bit,       active)
        request.addParameter('fileName',          TYPES.VarChar,   req.body.FileName)
        request.addParameter('dataStarts',        TYPES.datetime2, req.body.DataStarts)
        request.addParameter('dataEnds',          TYPES.datetime2, req.body.DataEnds)
        request.addParameter('userID',            TYPES.Int,       req.body.UserID)
        request.addParameter('equipmentIDSensor', TYPES.Int,       req.body.EquipmentIDSensor)
        request.addParameter('equipmentIDLogger', TYPES.Int,       req.body.EquipmentIDLogger)
        
        connection.execSql(request);
      });
    },
    
    addMetadata: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      let lastid     = 0;
      
      console.log(req.body);
      
      connection.on('connect', function(err) {
        
        let active = req.body.Active;
          
        let statement = `INSERT INTO Metadata
          (SamplePointID, ParameterID, MethodID, UnitID,
          FrequencyMinutes, DecimalPoints, Active, Notes,
          FileName, DataStarts, DataEnds, UserID,
          EquipmentIDSensor, EquipmentIDLogger,
          CorrectionOffset, CorrectionDrift, CorrectionStepChange)
          VALUES 
            (@samplePointID, @parameterID, @methodID,
            @unitID, @frequency, @decimals,
            @active, @notes,
            @fileName, @dataStarts, @dataEnds, @userID,
            @equipmentIDSensor, @equipmentIDLogger,
            @correctionOffset, @correctionDrift, @correctionStepChange);
          SELECT SCOPE_IDENTITY() AS LastID;`
          
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(lastid);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          lastid = columns[0].value;
        });
        
        // NEW APPROACH
        //   Assume all date values are valid ISO strings, including the UTC offset string.
        //   This should be pretty easy to do using Luxon.
        
        // Add parameters
        request.addParameter('samplePointID',        TYPES.Int,       req.body.SamplePointID);
        request.addParameter('parameterID',          TYPES.Int,       req.body.ParameterID);
        request.addParameter('methodID',             TYPES.Int,       req.body.MethodID);
        request.addParameter('unitID',               TYPES.Int,       req.body.UnitID);
        request.addParameter('frequency',            TYPES.Int,       req.body.FrequencyMinutes);
        request.addParameter('decimals',             TYPES.Int,       req.body.DecimalPoints);
        request.addParameter('notes',                TYPES.VarChar,   req.body.Notes);
        request.addParameter('active',               TYPES.Bit,       active);
        request.addParameter('graphTypeID',          TYPES.Int,       req.body.GraphTypeID);
        request.addParameter('fileName',             TYPES.VarChar,   req.body.FileName);
        request.addParameter('dataStarts',           TYPES.VarChar,   req.body.DataStarts);
        request.addParameter('dataEnds',             TYPES.VarChar,   req.body.DataEnds);
        request.addParameter('userID',               TYPES.Int,       req.body.UserID);
        request.addParameter('equipmentIDSensor',    TYPES.Int,       req.body.EquipmentIDSensor);
        request.addParameter('equipmentIDLogger',    TYPES.Int,       req.body.EquipmentIDLogger);
        request.addParameter(
          'correctionOffset', 
          TYPES.Numeric,   
          req.body.CorrectionOffset,
          {precision: 7, scale: 3});
        request.addParameter(
          'correctionDrift',
          TYPES.Numeric,
          req.body.CorrectionDrift,
          {precision: 7, scale: 3});
        request.addParameter(
          'correctionStepChange',
          TYPES.Numeric,
          req.body.CorrectionStepChange,
          {precision: 18, scale: 15});
        
        connection.execSql(request);
        
      });
    },
    
    deleteMetadata: function(req, res) {
      
      if (typeof req.query.MetadataID == 'undefined') {
        res.status(400).json('Must provide a MetadataID to delete measurements.');
      } else {
        let mssql_config = cfg.getConfig().mssql;
        let connection = new Connection(mssql_config);
        
        let MetadataID = req.query.MetadataID;
        
        connection.on('connect', function(err) {
          
          let statement = `DELETE Metadata 
           WHERE MetadataID = @MetadataID`
          
           var request = new Request(statement, function(err, rowCount) {
             if (err) {
               res.status(400).json(err);
               console.log(err);
             } else {
               res.status(200).json(MetadataID);
             }
             connection.close();
           });
          
          request.addParameter('MetadataID', TYPES.Int, MetadataID);
          
          connection.execSql(request);
        });
      };
    }
    
};

module.exports = controller;

