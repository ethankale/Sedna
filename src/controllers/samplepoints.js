"use strict";

var Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getSamplePointList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT SamplePointID, st.Code + ': ' + st.Name + ' (' + sp.Name + ')' as Name
      FROM SamplePoint as sp
      INNER JOIN Site as st
      ON sp.SiteID = st.SiteID
      ORDER BY st.Code ASC`
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getSamplePointDetails: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let samplePoint = {};
    
    let spid = req.query.samplepointid;
    
    if (typeof spid === 'undefined') {
      res.status(400).json("Must supply samplepointid.");
    }
    
    connection.on('connect', function(err) {
    
      let statement = `SELECT 
        [SamplePointID]
        ,[SiteID]
        ,[Name]
        ,[Description]
        ,[Latitude]
        ,[Longitude]
        ,[ElevationFeet]
        ,[ElevationDatum]
        ,[ElevationReference]
        ,[LatLongAccuracyFeet]
        ,[LatLongDate]
        ,[LatLongDetails]
        ,[ElevationAccuracyFeet]
        ,[ElevationDate]
        ,[ElevationDetails]
        ,[WellType]
        ,[WellCompletionType]
        ,[WellIntervalTopFeet]
        ,[WellIntervalBottomFeet]
        ,[WellInnerDiameterInches]
        ,[WellOuterDiameterInches]
        ,[WellStickupFeet]
        ,[WellStickupDate]
        ,[WellDrilledBy]
        ,[WellEcologyTagID]
        ,[WellEcologyStartCardID]
        ,[AddedOn]
        ,[RemovedOn]
        ,[Active]
      FROM [SamplePoint]
      WHERE SamplePointID = @spID`
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          res.status(200).json(samplePoint);
        }
        connection.close();
      });
      
      request.on('row', function(columns) {
        columns.forEach(function(column) {
          samplePoint[[column.metadata.colName]] = column.value;
        });
      });
      
      request.addParameter('spID', TYPES.Int, spid)
      
      connection.execSql(request);
    });
  }
  
};

module.exports = controller;