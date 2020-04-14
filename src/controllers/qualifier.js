"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getQualifierList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT QualifierID, Code
      FROM Qualifier
      ORDER BY Code ASC`
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getQualifierDetails: function(req, res) {
    if (typeof req.query.QualifierID == 'undefined') {
      res.status('400').json('QualifierID is required.');
    } else {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      let qualifierid    = req.query.QualifierID;
      
      let returndata = {};
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
          res.status(400).end();
        } 
        
        let statement = `SELECT 
            [QualifierID]
            ,[Code]
            ,[Description]
          FROM [Qualifier]
          WHERE QualifierID = @qualifierid`;
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returndata);
          }
          connection.close();
        });
        
        request.addParameter('qualifierid', TYPES.Int, qualifierid);
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
              returndata[[column.metadata.colName]] = column.value;
          });
        });
        
        connection.execSql(request);
      });
    };
  },
  
  updateQualifier: function(req, res) {
    if (typeof req.body.QualifierID == 'undefined') {
      res.status(400).json("Must include a QualifierID to update a qualifier.")
    } else {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      connection.on('connect', function(err) {
        
        let statement = `UPDATE [Qualifier] SET
          Code        = @code,
          Description = @description
          WHERE QualifierID = @qualifierid`;
          
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json("Success");
          }
          connection.close();
        });
        
        request.addParameter('qualifierid', TYPES.Int, req.body.QualifierID);
        request.addParameter('code',        TYPES.VarChar, req.body.Code);
        request.addParameter('description', TYPES.VarChar, req.body.Description);
        
        connection.execSql(request);
      });
    };
  },
  
  addQualifier: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [Qualifier]
      (Code, Description)
      VALUES (@code, @description);
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
      
      connection.execSql(request);
    });
  }
};

module.exports = controller;