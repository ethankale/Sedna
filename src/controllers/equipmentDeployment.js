"use strict";

var Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getEquipmentDeploymentList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    // let active    = req.query.active;
    
    let statement = `SELECT EquipmentDeploymentID, ed.EquipmentID, 
        ed.MetadataID, eq.SerialNumber, em.Manufacturer, 
        em.Name as EquipmentName, st.Code as SiteCode, st.Name as SiteName
    FROM EquipmentDeployment as ed
    LEFT JOIN Equipment as eq
      ON eq.EquipmentID = ed.EquipmentID
    LEFT JOIN EquipmentModel as em
      ON eq.EquipmentModelID = em.EquipmentModelID
    LEFT JOIN Metadata as md
      ON md.MetadataID = ed.MetadataID
      AND md.Active = 1
    LEFT JOIN SamplePoint as sp
      ON md.SamplePointID = sp.SamplePointID
    LEFT JOIN Site as st
      ON sp.SiteID = st.SiteID`;
    
    // if (typeof active != 'undefined') {
      // active = active >= 1 ? 1 : 0;
      // statement += " WHERE eq.Active = " + active;
    // };
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getEquipmentDeploymentDetails: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let equipmentDeployment = {};
    
    let edID = req.query.equipmentdeploymentid;
    
    if (typeof edID === 'undefined') {
      res.status(400).json("Must supply equipmentdeploymentid.");
    } else {
    
      connection.on('connect', function(err) {
      
        let statement = `SELECT 
        [EquipmentDeploymentID]
        ,[EquipmentID]
        ,[MetadataID]
        ,[Notes]
        FROM EquipmentDeployment as eq
        WHERE EquipmentDeploymentID = @edID`
        
        let request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(equipmentDeployment);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
            equipmentDeployment[[column.metadata.colName]] = column.value;
          });
        });
        
        request.addParameter('edID', TYPES.Int, edID)
        
        connection.execSql(request);
      });
    };
  },
  
  updateEquipmentDeployment: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection     = new Connection(mssql_config);
    
    connection.on('connect', function(err) {
      
      let statement = `UPDATE EquipmentDeployment SET 
        EquipmentID = @EquipmentID,
        MetadataID  = @MetadataID,
        Notes       = @Notes
        WHERE EquipmentDeploymentID = @EquipmentDeploymentID`
      
       var request = new Request(statement, function(err, rowCount) {
         if (err) {
           res.status(400).end();
           console.log(err);
         } else {
           res.status(200).json("Success");
         }
         connection.close();
       });
      
      request.addParameter('EquipmentID', TYPES.Int,       req.body.EquipmentID);
      request.addParameter('MetadataID',  TYPES.Int,       req.body.MetadataID);
      request.addParameter('Notes',       TYPES.VarChar,   req.body.Notes);
      
      connection.execSql(request);
      
    });
  },
  
  addEquipmentDeployment: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid     = 0;
    
    let Notes = typeof req.body.Notes === 'undefined' ? '' : req.body.Notes;
    Notes = Notes == null ? '' : Notes;
    
    if ((typeof req.body.MetadataID != 'undefined') && 
        (typeof req.body.EquipmentID != 'undefined')) {
      connection.on('connect', function(err) {
        
        let statement = `INSERT INTO EquipmentDeployment
            (EquipmentID, 
            MetadataID,
            Notes)
          VALUES 
            (@EquipmentID,
            @MetadataID,
            @Notes);
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
        
        
        request.addParameter('EquipmentID', TYPES.Int, req.body.EquipmentID);
        request.addParameter('MetadataID',  TYPES.Int, req.body.MetadataID);
        request.addParameter('Notes',       TYPES.VarChar, req.body.Notes);
        
        connection.execSql(request);
        
      });
    } else {
      res.status(400).json('Must provide at least a serial number with one character.')
    };
  }
  
};

module.exports = controller;