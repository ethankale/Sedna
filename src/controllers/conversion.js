"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');

const sqlfunctions = require('./sqlexecutefunction.js');

let controller = {
  getConversionList: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT ConversionID, ConversionName
      FROM [Conversion]`
    
    if (typeof active != 'undefined') {
      active = active >= 1 ? 1 : 0;
      statement += " WHERE Active = " + active;
    };
    
    statement += " ORDER BY ConversionName";
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
        res.status(400).end();
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let returndata = {};
    
    let statement = `SELECT ConversionID, ConversionName, CreatedBy, 
      CONVERT(nvarchar(10), [LastModified], 23) as LastModified,
      Active, Description
      FROM [Conversion] 
      WHERE ConversionID = @ConversionID\r`;
    
    connection.on('connect', function(err) {
      
      var request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          res.status(200).json(returndata);
        }
        connection.close();
      });
      
      request.on('row', function(columns) {
        columns.forEach(function(column) {
            returndata[[column.metadata.colName]] = column.value;
        });
      });
      
      request.addParameter('ConversionID', TYPES.Int, req.query.ConversionID);
      
      connection.execSql(request);
    });
  },
  
  updateConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let returndata = {};
    
    let statement = `UPDATE [Conversion] SET
      ConversionName = @name,
      CreatedBy      = @createdby,
      LastModified   = @lastmodified,
      Active         = @active,
      Description    = @description
      WHERE ConversionID = @ConversionID`;
    
    connection.on('connect', function(err) {
      
      var request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          res.status(200).json("Success");
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
      
      request.addParameter('ConversionID',  TYPES.Int, req.body.ConversionID);
      request.addParameter('name',          TYPES.VarChar, req.body.ConversionName);
      request.addParameter('createdby',     TYPES.VarChar, req.body.CreatedBy);
      request.addParameter('lastmodified',  TYPES.Date, req.body.LastModified);
      request.addParameter('description',   TYPES.VarChar, req.body.Description);
      request.addParameter('active',        TYPES.Bit, req.body.Active);
      
      connection.execSql(request);
    });
  },
  
  addConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [Conversion]
      (ConversionName, CreatedBy, LastModified, Description, Active)
      VALUES (@name, @createdby, @lastmodified, @description, @active);
      SELECT SCOPE_IDENTITY() AS LastID;\r`;
    
    connection.on('connect', function(err) {
      
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
      
      request.addParameter('name',          TYPES.VarChar, req.body.ConversionName);
      request.addParameter('createdby',     TYPES.VarChar, req.body.CreatedBy);
      request.addParameter('lastmodified',  TYPES.Date, req.body.LastModified);
      request.addParameter('description',   TYPES.VarChar, req.body.Description);
      request.addParameter('active',        TYPES.Bit, req.body.Active);
      
      connection.execSql(request);
    });
  }
};
module.exports = controller;

