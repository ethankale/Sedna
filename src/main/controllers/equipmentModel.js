"use strict";

var Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getEquipmentModelList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT 
        EquipmentModelID, 
        Name + ' (' + Coalesce(Manufacturer, '') + ')' as Name
      FROM EquipmentModel`;
    
    if (typeof active != 'undefined') {
      active = active >= 1 ? 1 : 0;
      statement += " WHERE Active = " + active;
    };
    
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getEquipmentModelDetails: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let equipmentModel = {};
    
    let emID = req.query.equipmentmodelid;
    
    if (typeof emID === 'undefined') {
      res.status(400).json("Must supply equipmentmodelid.");
    } else {
    
      connection.on('connect', function(err) {
      
        let statement = `SELECT 
          em.[EquipmentModelID]
          ,em.[Name]
          ,em.[Manufacturer]
          ,em.[Description]
          ,em.[Active],
        COUNT(eq.EquipmentID) as EquipmentCount
        FROM EquipmentModel as em
        LEFT JOIN Equipment as eq
        ON em.EquipmentModelID = eq.EquipmentModelID
        WHERE em.EquipmentModelID = @emID 
        GROUP BY em.EquipmentModelID, em.Name, em.Manufacturer, em.Description, em.Active;`
        
        let request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(equipmentModel);
          }
          connection.close();
        });
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
            equipmentModel[[column.metadata.colName]] = column.value;
          });
        });
        
        request.addParameter('emID', TYPES.Int, emID)
        
        connection.execSql(request);
      });
    };
  },
  
  updateEquipmentModel: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection     = new Connection(mssql_config);
    
    connection.on('connect', function(err) {
      
      let statement = `UPDATE EquipmentModel SET 
        Name         = @Name,
        Manufacturer = @Manufacturer,
        Description  = @Description,
        Active       = @Active
        WHERE EquipmentModelID = @EquipmentModelID`
      
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
      
      request.addParameter('EquipmentModelID', TYPES.Int,      req.body.EquipmentModelID);
      request.addParameter('Name',             TYPES.VarChar,  req.body.Name);
      request.addParameter('Manufacturer',     TYPES.VarChar,  req.body.Manufacturer);
      request.addParameter('Description',      TYPES.VarChar,  req.body.Description);
      request.addParameter('Active',           TYPES.Bit,      active);
      
      connection.execSql(request);
      
    });
  },
  
  addEquipmentModel: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid     = 0;
    
    let active = typeof req.body.Active === 'undefined' ? false : req.body.Active;
    let name   = typeof req.body.Name   === 'undefined' ? ''    : req.body.Name;
    
    name   = name == null   ? ''    : name;
    active = active == null ? false : active;
    
    if (name.trim().length > 0) {
      connection.on('connect', function(err) {
        
        let statement = `INSERT INTO EquipmentModel
            (Name, 
            Manufacturer,
            Description, 
            Active)
          VALUES 
            (@Name,
            @Manufacturer,
            @Description,
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
        
        
        request.addParameter('Name',         TYPES.VarChar, name);
        request.addParameter('Manufacturer', TYPES.VarChar, req.body.Manufacturer);
        request.addParameter('Description',  TYPES.VarChar, req.body.Description);
        request.addParameter('Active',       TYPES.Bit,     active);
        
        connection.execSql(request);
        
      });
    } else {
      res.status(400).json('Must provide at least a name with one character.')
    };
  }
  
};

module.exports = controller;