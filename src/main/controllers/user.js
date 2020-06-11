"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');

const sqlfunctions = require('./sqlexecutefunction.js');

let controller = {
  getUserList: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT UserID, Name
      FROM [User]`
    
    if (typeof active != 'undefined') {
      active = active >= 1 ? 1 : 0;
      statement += " WHERE Active = " + active;
    };
    
    statement += " ORDER BY Name";
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
        res.status(400).end();
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getUser: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let returndata = {};
    
    let statement = `SELECT UserID, Name, Email, Phone, Active
      FROM [User] 
      WHERE UserID = @UserID\r`;
    
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
      
      request.addParameter('UserID', TYPES.Int, req.query.UserID);
      
      connection.execSql(request);
    });
  },
  
  updateUser: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let returndata = {};
    
    let statement = `UPDATE [User] SET
      Name = @name,
      Email = @email,
      Phone = @phone,
      Active = @active
      WHERE UserID = @UserID\r`;
    
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
      
      request.addParameter('UserID', TYPES.Int, req.body.UserID);
      request.addParameter('name',   TYPES.VarChar, req.body.Name);
      request.addParameter('email',  TYPES.VarChar, req.body.Email);
      request.addParameter('phone',  TYPES.VarChar, req.body.Phone);
      request.addParameter('active', TYPES.VarChar, req.body.Active);
      
      connection.execSql(request);
    });
  },
  
  addUser: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [User]
      (Name, Email, Phone, Active)
      VALUES (@name, @email, @phone, @active);
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
      
      request.addParameter('name',   TYPES.VarChar, req.body.Name);
      request.addParameter('email',  TYPES.VarChar, req.body.Email);
      request.addParameter('phone',  TYPES.VarChar, req.body.Phone);
      request.addParameter('active', TYPES.VarChar, req.body.Active);
      
      connection.execSql(request);
    });
  }
};
module.exports = controller;

