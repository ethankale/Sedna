
"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getParameterDetails: function(req, res) {
      if (typeof req.query.ParameterID == 'undefined') {
        res.status('400').json('ParameterID is required.');
      } else {
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        let parameterid    = req.query.ParameterID;
        
        let returndata = {};
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
            res.status(400).end();
          } 
          
          let statement = `SELECT 
              [ParameterID]
              ,[Name]
              ,[CAS]
              ,[Description]
            FROM [Parameter]
            WHERE ParameterID = @parameterid`;
          
          var request = new Request(statement, function(err, rowCount) {
            if (err) {
              res.status(400).end();
              console.log(err);
            } else {
              res.status(200).json(returndata);
            }
            connection.close();
          });
          
          request.addParameter('parameterid', TYPES.Int, parameterid);
          
          request.on('row', function(columns) {
            columns.forEach(function(column) {
                returndata[[column.metadata.colName]] = column.value;
            });
          });
          
          connection.execSql(request);
        });
      };
    },
    
    getParameterList: function (req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      var statement = `SELECT ParameterID, Name
        FROM Parameter
        ORDER BY Name ASC`
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
        } else {
          sqlfunctions.executeSelect(statement, connection, res);
        }
      });
    },
    
    updateParameter: function(req, res) {
      
      if (typeof req.body.ParameterID == 'undefined') {
        res.status(400).json("Must include a ParameterID to update a parameter.")
      } else {
        let mssql_config = cfg.getConfig().mssql;
        let connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          
          let statement = `UPDATE [Parameter] SET
            Name        = @name,
            CAS         = @cas,
            Description = @description
            WHERE ParameterID = @parameterid`;
            
          var request = new Request(statement, function(err, rowCount) {
            if (err) {
              res.status(400).end();
              console.log(err);
            } else {
              res.status(200).json("Success");
            }
            connection.close();
          });
          
          request.addParameter('parameterid', TYPES.Int, req.body.ParameterID);
          request.addParameter('name',        TYPES.VarChar, req.body.Name);
          request.addParameter('cas',         TYPES.VarChar, req.body.CAS);
          request.addParameter('description', TYPES.VarChar, req.body.Description);
          
          connection.execSql(request);
        });
      };
    },
    
    addParameter: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      let lastid = 0;
      
      let statement = `INSERT INTO [Parameter]
        (Name, CAS, Description)
        VALUES (@name, @cas, @description);
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
        
        request.addParameter('name',        TYPES.VarChar, req.body.Name);
        request.addParameter('cas',         TYPES.VarChar, req.body.CAS);
        request.addParameter('description', TYPES.VarChar, req.body.Description);
        
        connection.execSql(request);
      });
    }
    
};

module.exports = controller;