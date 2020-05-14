"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg = require('./config.js');
let lx  = require('luxon');

const sqlfunctions = require('./sqlexecutefunction.js');

let controller = {
  getWorkupList: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let active    = req.query.active;
    
    let statement = `SELECT [WorkupID]
      ,[FileName]
      ,[DataStarts]
      ,[DataEnds]
      ,[LoadedOn]
      ,[MetadataID]
      ,[UserID]
      FROM [Workup]
      ORDER BY [LoadedOn]`;
    
    connection.on('connect', function(err) {
      if(err) {
        console.log('Error: ', err)
        res.status(400).end();
      } else {
        sqlfunctions.executeSelect(statement, connection, res);
      }
    });
  },
  
  getWorkup: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let WorkupID = req.query.WorkupID;
    
    let returndata = {};
    
    let statement = `SELECT [WorkupID]
      ,[FileName]
      ,[DataStarts]
      ,[DataEnds]
      ,[LoadedOn]
      ,[MetadataID]
      ,[UserID]
      FROM [Workup]
      WHERE [WorkupID] = @WorkupID`;
    
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
      
      request.addParameter('WorkupID', TYPES.Int, WorkupID);
      
      connection.execSql(request);
    });
  },
  
  addWorkup: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let FileName   = req.body.FileName;
    let MetadataID = req.body.MetadataID;
    let UserID     = req.body.UserID;
    let utcOffset  = req.body.offset;
    let DataStarts = utcDate(req.body.DataStarts, utcOffset);
    let DataEnds   = utcDate(req.body.DataEnds, utcOffset);
    
    let LoadedOn   = new Date();
    
    let lastid = 0;
    
    let statement = `INSERT INTO [Workup]
      (FileName, DataStarts, DataEnds, MetadataID, UserID)
      VALUES (@FileName, @DataStarts, @DataEnds, @MetadataID, @UserID);
      SELECT SCOPE_IDENTITY() AS LastID;`;
    
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
      
      request.addParameter('FileName',   TYPES.VarChar,   FileName);
      request.addParameter('DataStarts', TYPES.DateTime2, DataStarts, { nullable: false, scale: 0 });
      request.addParameter('DataEnds',   TYPES.DateTime2, DataEnds, { nullable: false, scale: 0 });
      request.addParameter('LoadedOn',   TYPES.DateTime2, LoadedOn, { nullable: false, scale: 0 });
      request.addParameter('MetadataID', TYPES.Int,       MetadataID);
      request.addParameter('UserID',     TYPES.Int,       UserID);
      
      connection.execSql(request);
    });
  }
};

// Takes a date string *formatted* in UTC but *actually* in local time,
//   and an offset in minutes, and returns a datetime in actually accurate UTC.
function utcDate(dt, offsetMinutes) {
  let offsetstring = offsetMinutes < 0 ? 'UTC' + offsetMinutes/60 : 'UTC+' + (offsetMinutes/60);
  let date = lx.DateTime
    .fromISO(dt)
    .setZone(offsetstring)
    .setZone('UTC', {keepLocalTime: true })
    .toJSDate();
  return(date);
}

module.exports = controller;

