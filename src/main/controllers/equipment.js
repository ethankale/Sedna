"use strict";

var Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getEquipmentList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT 
        eq.[EquipmentID],
        em.Name + ' - ' + eq.[SerialNumber] + ' (' + Coalesce(em.Manufacturer, '') + ')' as Name,
        activeDeployments.SiteCode, activeDeployments.SiteName
        FROM [Equipment] AS eq
        LEFT JOIN EquipmentModel AS em
        ON eq.EquipmentModelID = em.EquipmentModelID
        LEFT JOIN EquipmentDeployment as ed
        ON ed.EquipmentID = eq.EquipmentID
        LEFT JOIN (
            SELECT EquipmentDeploymentID, ed.EquipmentID, ed.MetadataID, st.Code as SiteCode, st.Name as SiteName
            FROM EquipmentDeployment as ed
            LEFT JOIN Metadata as md
            ON md.MetadataID = ed.MetadataID
            LEFT JOIN SamplePoint as sp
            ON md.SamplePointID = sp.SamplePointID
            LEFT JOIN Site as st
            ON sp.SiteID = st.SiteID
            WHERE md.Active = 1) as activeDeployments
        ON ed.EquipmentDeploymentID = activeDeployments.EquipmentDeploymentID`;
    
    if (typeof active != 'undefined') {
      active = active >= 1 ? 1 : 0;
      statement += " WHERE eq.Active = " + active;
    };
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getEquipmentDetails: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let equipment = {};
    
    let eqID = req.query.equipmentid;
    
    if (typeof eqID === 'undefined') {
      res.status(400).json("Must supply equipmentid.");
    } else {
    
      connection.on('connect', function(err) {
      
        let statement = `SELECT 
        [EquipmentID]
        ,[EquipmentModelID]
        ,[SerialNumber]
        ,CONVERT(nvarchar(10), [LastCalibrationDate], 23) as LastCalibrationDate
        ,[Notes]
        ,[Active]
        FROM Equipment as eq
        WHERE EquipmentID = @eqID`
        
        let request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(equipment);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
            equipment[[column.metadata.colName]] = column.value;
          });
        });
        
        request.addParameter('eqID', TYPES.Int, eqID)
        
        connection.execSql(request);
      });
    };
  },
  
  updateEquipment: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection     = new Connection(mssql_config);
    
    connection.on('connect', function(err) {
      
      let statement = `UPDATE Equipment SET 
        EquipmentModelID    = @EquipmentModelID,
        SerialNumber        = @SerialNumber,
        LastCalibrationDate = @LastCalibrationDate,
        Notes               = @Notes,
        Active              = @Active
        WHERE EquipmentID = @EquipmentID`
      
       var request = new Request(statement, function(err, rowCount) {
         if (err) {
           res.status(400).end();
           console.log(err);
         } else {
           res.status(200).json("Success");
         }
         connection.close();
       });
      
      let active = typeof req.body.Active == 'undefined' ? false : req.body.Active;
      
      request.addParameter('EquipmentID',         TYPES.Int,       req.body.EquipmentID);
      request.addParameter('EquipmentModelID',    TYPES.Int,       req.body.EquipmentModelID);
      request.addParameter('SerialNumber',        TYPES.VarChar,   req.body.SerialNumber);
      request.addParameter('LastCalibrationDate', TYPES.DateTime2, req.body.LastCalibrationDate);
      request.addParameter('Notes',               TYPES.VarChar,   req.body.Notes);
      request.addParameter('Active',              TYPES.Bit,       active);
      
      connection.execSql(request);
      
    });
  },
  
  addEquipment: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid     = 0;
    
    let active       = typeof req.body.Active === 'undefined'       ? false : req.body.Active;
    let SerialNumber = typeof req.body.SerialNumber === 'undefined' ? ''    : req.body.SerialNumber;
    
    active       = active == null       ? false : active;
    SerialNumber = SerialNumber == null ? ''    : SerialNumber;
    
    if (SerialNumber.trim().length > 0) {
      connection.on('connect', function(err) {
        
        let statement = `INSERT INTO Equipment
            (EquipmentModelID, 
            SerialNumber,
            LastCalibrationDate,
            Notes,
            Active)
          VALUES 
            (@EquipmentModelID,
            @SerialNumber,
            @LastCalibrationDate,
            @Notes,
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
        
        
        request.addParameter('EquipmentModelID',    TYPES.Int, req.body.EquipmentModelID);
        request.addParameter('SerialNumber',        TYPES.VarChar, SerialNumber);
        request.addParameter('LastCalibrationDate', TYPES.DateTime2, req.body.LastCalibrationDate);
        request.addParameter('Notes',               TYPES.VarChar, req.body.Notes);
        request.addParameter('Active',              TYPES.Bit,     active);
        
        connection.execSql(request);
        
      });
    } else {
      res.status(400).json('Must provide at least a serial number with one character.')
    };
  }
  
};

module.exports = controller;