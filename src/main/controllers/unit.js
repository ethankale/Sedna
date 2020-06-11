"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getUnitList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT UnitID, Symbol
      FROM Unit
      ORDER BY Symbol ASC`
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getUnitDetails: function(req, res) {
    if (typeof req.query.UnitID == 'undefined') {
      res.status('400').json('UnitID is required.');
    } else {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      let unitid    = req.query.UnitID;
      
      let returndata = {};
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
          res.status(400).end();
        } 
        
        let statement = `SELECT 
            [UnitID]
            ,[Symbol]
            ,[Description]
          FROM [Unit]
          WHERE UnitID = @unitid`;
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returndata);
          }
          connection.close();
        });
        
        request.addParameter('unitid', TYPES.Int, unitid);
        
        request.on('row', function(columns) {
          columns.forEach(function(column) {
              returndata[[column.metadata.colName]] = column.value;
          });
        });
        
        connection.execSql(request);
      });
    };
  },
  
  updateUnit: function(req, res) {
    if (typeof req.body.UnitID == 'undefined') {
      res.status(400).json("Must include a UnitID to update a unit.")
    } else {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      connection.on('connect', function(err) {
        
        let statement = `UPDATE [Unit] SET
          Symbol        = @symbol,
          Description = @description
          WHERE UnitID = @unitid`;
          
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json("Success");
          }
          connection.close();
        });
        
        request.addParameter('unitid',      TYPES.Int, req.body.UnitID);
        request.addParameter('symbol',      TYPES.VarChar, req.body.Symbol);
        request.addParameter('description', TYPES.VarChar, req.body.Description);
        
        connection.execSql(request);
      });
    };
  },
  
  addUnit: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [Unit]
      (Symbol, Description)
      VALUES (@symbol, @description);
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
      
      request.addParameter('symbol',      TYPES.VarChar, req.body.Symbol);
      request.addParameter('description', TYPES.VarChar, req.body.Description);
      
      connection.execSql(request);
    });
  }
};

module.exports = controller;