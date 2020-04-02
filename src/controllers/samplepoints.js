"use strict";

var Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getSamplePointList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT SamplePointID, st.Code + ': ' + st.Name + ' (' + sp.Name + ')' as Name
      FROM SamplePoint as sp
      INNER JOIN Site as st
      ON sp.SiteID = st.SiteID`
    if (typeof active != 'undefined') {
      active = active == 1 ? 1 : 0;
      statement += " WHERE sp.Active = " + active + " AND st.Active = " + active;
    };
    statement += ' ORDER BY st.Code ASC;'
    
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
  },
  
  updateSamplePoint: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection     = new Connection(mssql_config);
    
    connection.on('connect', function(err) {
      
      let statement = `UPDATE SamplePoint SET 
        SiteID =                   @SiteID,
        Name =                     @Name,
        Description =              @Description,
        Latitude =                 @Latitude,
        Longitude =                @Longitude,
        ElevationFeet =            @ElevationFeet,
        ElevationDatum =           @ElevationDatum,
        ElevationReference =       @ElevationReference,
        LatLongAccuracyFeet =      @LatLongAccuracyFeet,
        LatLongDate =              @LatLongDate,
        LatLongDetails =           @LatLongDetails,
        ElevationAccuracyFeet =    @ElevationAccuracyFeet,
        ElevationDate =            @ElevationDate,
        ElevationDetails =         @ElevationDetails,
        WellType =                 @WellType,
        WellCompletionType =       @WellCompletionType,
        WellIntervalTopFeet =      @WellIntervalTopFeet,
        WellIntervalBottomFeet =   @WellIntervalBottomFeet,
        WellInnerDiameterInches =  @WellInnerDiameterInches,
        WellOuterDiameterInches =  @WellOuterDiameterInches,
        WellStickupFeet =          @WellStickupFeet,
        WellStickupDate =          @WellStickupDate,
        WellDrilledBy =            @WellDrilledBy,
        WellEcologyTagID =         @WellEcologyTagID,
        WellEcologyStartCardID =   @WellEcologyStartCardID,
        AddedOn =                  @AddedOn,
        RemovedOn =                @RemovedOn,
        Active =                   @Active
        WHERE SamplePointID = @SamplePointID`
      
       var request = new Request(statement, function(err, rowCount) {
         if (err) {
           res.status(400).end();
           console.log(err);
         } else {
           res.status(200).json("Success");
         }
         connection.close();
       });
      
      let active = typeof req.body.active == 'undefined' ? false : req.body.active;
      
      request.addParameter('SamplePointID',             TYPES.Int,          req.body.SamplePointID)
      request.addParameter('SiteID',                    TYPES.Int,          req.body.SiteID)
      request.addParameter('Name',                      TYPES.VarChar,      req.body.Name)
      request.addParameter('Description',               TYPES.VarChar,      req.body.Description)
      request.addParameter('Latitude',                  TYPES.Numeric,      req.body.Latitude,
        {precision: 9, scale: 6})
      request.addParameter('Longitude',                 TYPES.Numeric,      req.body.Longitude,
        {precision: 9, scale: 6})
      request.addParameter('ElevationFeet',             TYPES.Numeric,      req.body.ElevationFeet,
        {precision: 8, scale: 2})
      request.addParameter('ElevationDatum',            TYPES.VarChar,      req.body.ElevationDatum)
      request.addParameter('ElevationReference',        TYPES.VarChar,      req.body.ElevationReference)
      request.addParameter('LatLongAccuracyFeet',       TYPES.SmallInt,     req.body.LatLongAccuracyFeet)
      request.addParameter('LatLongDate',               TYPES.DateTime2,    req.body.LatLongDate)
      request.addParameter('LatLongDetails',            TYPES.VarChar,      req.body.LatLongDetails)
      request.addParameter('ElevationAccuracyFeet',     TYPES.SmallInt,     req.body.ElevationAccuracyFeet)
      request.addParameter('ElevationDate',             TYPES.DateTime2,    req.body.ElevationDate)
      request.addParameter('ElevationDetails',          TYPES.VarChar,      req.body.ElevationDetails)
      request.addParameter('WellType',                  TYPES.VarChar,      req.body.WellType)
      request.addParameter('WellCompletionType',        TYPES.VarChar,      req.body.WellCompletionType)
      request.addParameter('WellIntervalTopFeet',       TYPES.Numeric,      req.body.WellIntervalTopFeet,
        {precision: 6, scale: 2})
      request.addParameter('WellIntervalBottomFeet',    TYPES.Numeric,      req.body.WellIntervalBottomFeet,
        {precision: 6, scale: 2})
      request.addParameter('WellInnerDiameterInches',   TYPES.Numeric,      req.body.WellInnerDiameterInches,
        {precision: 4, scale: 2})
      request.addParameter('WellOuterDiameterInches',   TYPES.Numeric,      req.body.WellOuterDiameterInches,
        {precision: 4, scale: 2})
      request.addParameter('WellStickupFeet',           TYPES.Numeric,      req.body.WellStickupFeet,
        {precision: 4, scale: 2})
      request.addParameter('WellStickupDate',           TYPES.DateTime2,    req.body.WellStickupDate)
      request.addParameter('WellDrilledBy',             TYPES.VarChar,      req.body.WellDrilledBy)
      request.addParameter('WellEcologyTagID',          TYPES.VarChar,      req.body.WellEcologyTagID)
      request.addParameter('WellEcologyStartCardID',    TYPES.VarChar,      req.body.WellEcologyStartCardID)
      request.addParameter('AddedOn',                   TYPES.DateTime2,    req.body.AddedOn)
      request.addParameter('RemovedOn',                 TYPES.DateTime2,    req.body.RemovedOn)
      request.addParameter('Active',                    TYPES.Bit,          active)
      
      connection.execSql(request);
      
    });
  },
  
  addSamplePoint: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid     = 0;
    
    connection.on('connect', function(err) {
      
      let statement = `INSERT INTO SamplePoint
          (SiteID, 
          Name, 
          Description, 
          Latitude, 
          Longitude,
          ElevationFeet, 
          ElevationDatum, 
          ElevationReference,
          LatLongAccuracyFeet, 
          LatLongDate, 
          LatLongDetails,
          ElevationAccuracyFeet, 
          ElevationDate, 
          ElevationDetails,
          WellType, 
          WellCompletionType, 
          WellIntervalTopFeet, 
          WellIntervalBottomFeet, 
          WellInnerDiameterInches, 
          WellOuterDiameterInches, 
          WellStickupFeet, 
          WellStickupDate,
          WellDrilledBy, 
          WellEcologyTagID, 
          WellEcologyStartCardID, 
          AddedOn, 
          RemovedOn, 
          Active)
        VALUES 
          (@SiteID,
          @Name,
          @Description,
          @Latitude,
          @Longitude,
          @ElevationFeet,
          @ElevationDatum,
          @ElevationReference,
          @LatLongAccuracyFeet,
          @LatLongDate,
          @LatLongDetails,
          @ElevationAccuracyFeet,
          @ElevationDate,
          @ElevationDetails,
          @WellType,
          @WellCompletionType,
          @WellIntervalTopFeet,
          @WellIntervalBottomFeet,
          @WellInnerDiameterInches,
          @WellOuterDiameterInches,
          @WellStickupFeet,
          @WellStickupDate,
          @WellDrilledBy,
          @WellEcologyTagID,
          @WellEcologyStartCardID,
          @AddedOn,
          @RemovedOn,
          @Active);
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
      
      let active = typeof req.body.active == 'undefined' ? false : req.body.active;
      
      request.addParameter('SiteID',                    TYPES.Int,          req.body.SiteID)
      request.addParameter('Name',                      TYPES.VarChar,      req.body.Name)
      request.addParameter('Description',               TYPES.VarChar,      req.body.Description)
      request.addParameter('Latitude',                  TYPES.Numeric,      req.body.Latitude,
        {precision: 9, scale: 6})
      request.addParameter('Longitude',                 TYPES.Numeric,      req.body.Longitude,
        {precision: 9, scale: 6})
      request.addParameter('ElevationFeet',             TYPES.Numeric,      req.body.ElevationFeet,
        {precision: 8, scale: 2})
      request.addParameter('ElevationDatum',            TYPES.VarChar,      req.body.ElevationDatum)
      request.addParameter('ElevationReference',        TYPES.VarChar,      req.body.ElevationReference)
      request.addParameter('LatLongAccuracyFeet',       TYPES.SmallInt,     req.body.LatLongAccuracyFeet)
      request.addParameter('LatLongDate',               TYPES.DateTime2,    req.body.LatLongDate)
      request.addParameter('LatLongDetails',            TYPES.VarChar,      req.body.LatLongDetails)
      request.addParameter('ElevationAccuracyFeet',     TYPES.SmallInt,     req.body.ElevationAccuracyFeet)
      request.addParameter('ElevationDate',             TYPES.DateTime2,    req.body.ElevationDate)
      request.addParameter('ElevationDetails',          TYPES.VarChar,      req.body.ElevationDetails)
      request.addParameter('WellType',                  TYPES.VarChar,      req.body.WellType)
      request.addParameter('WellCompletionType',        TYPES.VarChar,      req.body.WellCompletionType)
      request.addParameter('WellIntervalTopFeet',       TYPES.Numeric,      req.body.WellIntervalTopFeet,
        {precision: 6, scale: 2})
      request.addParameter('WellIntervalBottomFeet',    TYPES.Numeric,      req.body.WellIntervalBottomFeet,
        {precision: 6, scale: 2})
      request.addParameter('WellInnerDiameterInches',   TYPES.Numeric,      req.body.WellInnerDiameterInches,
        {precision: 4, scale: 2})
      request.addParameter('WellOuterDiameterInches',   TYPES.Numeric,      req.body.WellOuterDiameterInches,
        {precision: 4, scale: 2})
      request.addParameter('WellStickupFeet',           TYPES.Numeric,      req.body.WellStickupFeet,
        {precision: 4, scale: 2})
      request.addParameter('WellStickupDate',           TYPES.DateTime2,    req.body.WellStickupDate)
      request.addParameter('WellDrilledBy',             TYPES.VarChar,      req.body.WellDrilledBy)
      request.addParameter('WellEcologyTagID',          TYPES.VarChar,      req.body.WellEcologyTagID)
      request.addParameter('WellEcologyStartCardID',    TYPES.VarChar,      req.body.WellEcologyStartCardID)
      request.addParameter('AddedOn',                   TYPES.DateTime2,    req.body.AddedOn)
      request.addParameter('RemovedOn',                 TYPES.DateTime2,    req.body.RemovedOn)
      request.addParameter('Active',                    TYPES.Bit,          active)
      
      connection.execSql(request);
      
    });
  }
  
};

module.exports = controller;