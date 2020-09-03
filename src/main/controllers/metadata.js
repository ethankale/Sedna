"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

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
    
    getMetadatasBySamplePoint: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var spID    = req.query.spID;
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          
          let statement = `
            SELECT md.MetadataID, sp.SiteID, md.ParameterID, pm.Name as Parameter, 
              md.MethodID, mt.Code as Method, md.UnitID, un.Symbol as Unit, FrequencyMinutes, DecimalPoints
            FROM Metadata as md
            INNER JOIN SamplePoint as sp
              ON md.SamplePointID = sp.SamplePointID
            INNER JOIN Parameter as pm
              ON pm.ParameterID = md.ParameterID
            INNER JOIN Method as mt
              ON mt.MethodID = md.MethodID
            INNER JOIN Unit as un
              ON un.UnitID = md.UnitID
            WHERE sp.SamplePointID = @spID
              AND md.Active = 1
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
                ,[LoadedOn]
                ,[UserID]
                ,[CreatedOn]
              FROM Metadata as md
              LEFT JOIN Measurement as ms
                on md.MetadataID = ms.MetadataID
              WHERE md.MetadataID = ${metaid}
              GROUP BY md.MetadataID, md.ParameterID, md.UnitID, md.SamplePointID, 
                md.Notes, md.MethodID, md.Active, md.FrequencyMinutes, md.DecimalPoints,
                md.FileName, md.DataStarts, md.DataEnds, md.LoadedOn, md.UserID, md.CreatedOn`
            
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
            LoadedOn          = @loadedOn,
            UserID            = @userID
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
        
        request.addParameter('metadataID',    TYPES.Int,       req.body.MetadataID)
        request.addParameter('samplePointID', TYPES.Int,       req.body.SamplePointID)
        request.addParameter('parameterID',   TYPES.Int,       req.body.ParameterID)
        request.addParameter('methodID',      TYPES.Int,       req.body.MethodID)
        request.addParameter('unitID',        TYPES.Int,       req.body.UnitID)
        request.addParameter('frequency',     TYPES.Int,       req.body.FrequencyMinutes)
        request.addParameter('decimals',      TYPES.Int,       req.body.DecimalPoints)
        request.addParameter('notes',         TYPES.VarChar,   req.body.Notes)
        request.addParameter('active',        TYPES.Bit,       active)
        request.addParameter('fileName',      TYPES.VarChar,   req.body.FileName)
        request.addParameter('dataStarts',    TYPES.datetime2, req.body.DataStarts)
        request.addParameter('dataEnds',      TYPES.datetime2, req.body.DataEnds)
        request.addParameter('loadedOn',      TYPES.datetime2, req.body.LoadedOn)
        request.addParameter('userID',        TYPES.Int,       req.body.UserID)
        
        connection.execSql(request);
      });
    },
    
    addMetadata: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      let lastid     = 0;
      
      //console.log(req.body);
      
      connection.on('connect', function(err) {
        
        let active = req.body.Active;
          
        let statement = `INSERT INTO Metadata
          (SamplePointID, ParameterID, MethodID, UnitID,
          FrequencyMinutes, DecimalPoints, Active, Notes)
          VALUES 
            (@samplePointID, @parameterID, @methodID,
            @unitID, @frequency, @decimals,
            @active, @notes,
            @fileName, @dataStarts, @dataEnds, @loadedOn, @userID);
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
        
        request.addParameter('samplePointID',   TYPES.Int, req.body.SamplePointID)
        request.addParameter('parameterID',     TYPES.Int, req.body.ParameterID)
        request.addParameter('methodID',        TYPES.Int, req.body.MethodID)
        request.addParameter('unitID',          TYPES.Int, req.body.UnitID)
        request.addParameter('frequency',       TYPES.Int, req.body.FrequencyMinutes)
        request.addParameter('decimals',        TYPES.Int, req.body.DecimalPoints)
        request.addParameter('notes',           TYPES.VarChar, req.body.Notes)
        request.addParameter('active',          TYPES.Bit, active)
        request.addParameter('graphTypeID',     TYPES.Int,       req.body.GraphTypeID)
        request.addParameter('fileName',        TYPES.VarChar,   req.body.FileName)
        request.addParameter('dataStarts',      TYPES.datetime2, req.body.DataStarts)
        request.addParameter('dataEnds',        TYPES.datetime2, req.body.DataEnds)
        request.addParameter('loadedOn',        TYPES.datetime2, req.body.LoadedOn)
        request.addParameter('userID',          TYPES.Int,       req.body.UserID)
        
        connection.execSql(request);
        
      });
    }
};

module.exports = controller;

