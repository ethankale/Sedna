"use strict";

let Connection = require('tedious').Connection;
let TYPES      = require('tedious').TYPES;
let Request    = require('tedious').Request;
let cfg = require('./config.js');

const sqlfunctions = require('./sqlexecutefunction.js');

let controller = {
  getUserList: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let statement = `SELECT UserID, Name
      FROM [User] \r`
    
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
    
    let returndata = [];
    
    let statement = `SELECT UserID, Name, Email, Phone
      FROM [User] 
      WHERE UserID = @userid\r`;
    
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
        let thisrow = {}
        columns.forEach(function(column) {
            thisrow[[column.metadata.colName]] = column.value;
        });
        returndata.push(thisrow);
      });
      
      request.addParameter('userid', TYPES.Int, req.query.userid);
      
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
      Phone = @phone
      WHERE UserID = @userid\r`;
    
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
      
      request.addParameter('userid', TYPES.Int, req.body.userid);
      request.addParameter('name', TYPES.VarChar, req.body.name);
      request.addParameter('email', TYPES.VarChar, req.body.email);
      request.addParameter('phone', TYPES.VarChar, req.body.phone);
      
      connection.execSql(request);
    });
  },
  
  addUser: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let lastid = 0;
    
    let statement = `INSERT INTO [User]
      (Name, Email, Phone)
      VALUES (@name, @email, @phone);
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
      
      request.addParameter('userid', TYPES.Int, req.body.userid);
      request.addParameter('name', TYPES.VarChar, req.body.name);
      request.addParameter('email', TYPES.VarChar, req.body.email);
      request.addParameter('phone', TYPES.VarChar, req.body.phone);
      
      connection.execSql(request);
    });
  }
};
module.exports = controller;

