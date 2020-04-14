"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getMethodList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT MethodID, Code + ': ' + Description as Name
      FROM Method
      ORDER BY Code ASC`
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getMethodDetails: function(req, res) {
    if (typeof req.query.MethodID == 'undefined') {
      res.status('400').json('MethodID is required.');
    } else {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      let methodid    = req.query.MethodID;
      
      let returndata = {};
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
          res.status(400).end();
        } 
        
        let statement = `SELECT 
            [MethodID]
            ,[Code]
            ,[Description]
            ,[Reference]
          FROM [Method]
          WHERE MethodID = @methodid`;
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returndata);
          }
          connection.close();
        });
        
        request.addParameter('methodid', TYPES.Int, methodid);
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
              returndata[[column.metadata.colName]] = column.value;
          });
        });
        
        connection.execSql(request);
      });
    };
  },
  
  updateMethod: function(req, res) {
    if (typeof req.body.MethodID == 'undefined') {
      res.status(400).json("Must include a MethodID to update a method.")
    } else {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      connection.on('connect', function(err) {
        
        let statement = `UPDATE [Method] SET
          Code        = @code,
          Description = @description,
          Reference   = @reference
          WHERE MethodID = @methodid`;
          
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json("Success");
          }
          connection.close();
        });
        
        request.addParameter('methodid',    TYPES.Int, req.body.MethodID);
        request.addParameter('code',        TYPES.VarChar, req.body.Code);
        request.addParameter('description', TYPES.VarChar, req.body.Description);
        request.addParameter('reference',   TYPES.VarChar, req.body.Reference);
        
        connection.execSql(request);
      });
    };
  },
  
  addMethod: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [Method]
      (Code, Description, Reference)
      VALUES (@code, @description, @reference);
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
      
      request.addParameter('code',        TYPES.VarChar, req.body.Code);
      request.addParameter('description', TYPES.VarChar, req.body.Description);
      request.addParameter('reference',   TYPES.VarChar, req.body.Reference);
      
      connection.execSql(request);
    });
  }
};

module.exports = controller;