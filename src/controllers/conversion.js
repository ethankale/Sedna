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
  
  // First, get the data from the conversion table.
  //   Then, get all the matching ConversionValue records,
  //   and append them as a list to the results, and send that back.
  getConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let returndata     = {};
    let conversionVals = [];
    
    connection.on('connect', function(err) {
      
      let statement = `SELECT ConversionID, ConversionName, CreatedBy, 
      CONVERT(nvarchar(10), [LastModified], 23) as LastModified,
      Active, Description
      FROM [Conversion] 
      WHERE ConversionID = @ConversionID\r`;
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          getConversionValues();
        }
      });
      
      request.on('row', function(columns) {
        columns.forEach(function(column) {
            returndata[[column.metadata.colName]] = column.value;
        });
      });
      
      request.addParameter('ConversionID', TYPES.Int, req.query.ConversionID);
      
      connection.execSql(request);
    });
    
    let getConversionValues = function() {
      
      let statement = `SELECT FromValue, ToValue
      FROM [ConversionValue] 
      WHERE ConversionID = @ConversionID
      ORDER BY FromValue ASC`;
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          returndata.ConversionValues = conversionVals;
          res.status(200).json(returndata);
        }
        connection.close();
      });
      
      request.on('row', function(columns) {
        let cv = {};
        columns.forEach(function(column) {
            cv[[column.metadata.colName]] = column.value;
        });
        conversionVals.push(cv);
      });
      
      request.addParameter('ConversionID', TYPES.Int, req.query.ConversionID);
      
      connection.execSql(request);
    };
    
  },
  
  updateConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let ConversionValues = req.body.ConversionValues;
    
    connection.on('connect', function(err) {
      
      let statement = `UPDATE [Conversion] SET
      ConversionName = @name,
      CreatedBy      = @createdby,
      LastModified   = @lastmodified,
      Active         = @active,
      Description    = @description
      WHERE ConversionID = @ConversionID;
      DELETE ConversionValue
      WHERE ConversionID = @ConversionID;`;
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          console.log(err);
          res.status(400).end();
        } else {
          if (ConversionValues.length > 0) {
            loadBulkData();
          } else {
            res.status(200).json("Success");
            connection.close();
          }
        }
      });
      
      request.addParameter('ConversionID',  TYPES.Int, req.body.ConversionID);
      request.addParameter('name',          TYPES.VarChar, req.body.ConversionName);
      request.addParameter('createdby',     TYPES.VarChar, req.body.CreatedBy);
      request.addParameter('lastmodified',  TYPES.Date, req.body.LastModified);
      request.addParameter('description',   TYPES.VarChar, req.body.Description);
      request.addParameter('active',        TYPES.Bit, req.body.Active);
      
      connection.execSql(request);
    });
    
    function loadBulkData() {
      var option = { keepNulls: true }; // option to honor null
      var bulkLoad = connection.newBulkLoad('ConversionValue', option, function(err, rowCont) {
        if (err) {
          console.log("Could not bulk load conversion values.  " + err)
          res.status(400).end();
        } else {
          res.status(200).json("Success");
        }
        connection.close();
      });
      
      // setup columns
      bulkLoad.addColumn('ConversionID', TYPES.Int, { nullable: false });
      bulkLoad.addColumn('FromValue',    TYPES.Numeric, { nullable: false, precision: 18, scale: 6 });
      bulkLoad.addColumn('ToValue',      TYPES.Numeric, { nullable: false, precision: 18, scale: 6 });
      
      // add rows
      ConversionValues.forEach( (cv, index) => {
        let cv_new = {};
        cv_new.ConversionID = parseInt(req.body.ConversionID);
        cv_new.FromValue    = parseFloat(cv.FromValue);
        cv_new.ToValue      = parseFloat(cv.ToValue);
        
        bulkLoad.addRow(cv_new);
      });
      
      // perform bulk insert
      connection.execBulkLoad(bulkLoad);
    }
    
  },
  
  addConversion: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    
    let insertConnection = new Connection(mssql_config);
    
    let lastid = null;
    let ConversionValues = req.body.ConversionValues;
    
    insertConnection.on('connect', function(err) {
      let statement = `INSERT INTO [Conversion]
          (ConversionName, CreatedBy, LastModified, Description, Active)
          VALUES (@name, @createdby, @lastmodified, @description, @active);
          SELECT SCOPE_IDENTITY() AS LastID;\r`;
      
      var request = new Request(statement, function(err, rowCount) {
        if (err) {
          res.status(400).end();
          console.log(err);
        } else {
          loadBulkData();
        }
      });
      
      request.on('row', function(columns) {
        lastid = columns[0].value;
      });
      
      request.addParameter('name',          TYPES.VarChar, req.body.ConversionName);
      request.addParameter('createdby',     TYPES.VarChar, req.body.CreatedBy);
      request.addParameter('lastmodified',  TYPES.Date, req.body.LastModified);
      request.addParameter('description',   TYPES.VarChar, req.body.Description);
      request.addParameter('active',        TYPES.Bit, req.body.Active);
      
      insertConnection.execSql(request);
    });
    
    
    function loadBulkData() {
      var option = { keepNulls: true }; // option to honor null
      var bulkLoad = insertConnection.newBulkLoad('ConversionValue', option, function(err, rowCont) {
        if (err) {
          console.log("Could not bulk load conversion values.  " + err)
          res.status(400).end();
        } else {
          console.log('rows inserted :', rowCont);
          res.status(200).json(lastid);
        }
        insertConnection.close();
      });
      
      // setup columns
      bulkLoad.addColumn('ConversionID', TYPES.Int, { nullable: false });
      bulkLoad.addColumn('FromValue',    TYPES.Numeric, { nullable: false, precision: 18, scale: 6 });
      bulkLoad.addColumn('ToValue',      TYPES.Numeric, { nullable: false, precision: 18, scale: 6 });
      
      // add rows
      ConversionValues.forEach( (cv, index) => {
        let cv_new = {};
        cv_new.ConversionID = parseInt(lastid);
        cv_new.FromValue    = parseFloat(cv.FromValue);
        cv_new.ToValue      = parseFloat(cv.ToValue);
        
        bulkLoad.addRow(cv_new);
      });
      
      // perform bulk insert
      insertConnection.execBulkLoad(bulkLoad);
    }
  },
  
  conversionStats: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    let MetadataID   = req.query.MetadataID;
    let ConversionID = req.query.ConversionID;
    let FromDate     = new Date(req.query.FromDate);
    let ToDate       = new Date(req.query.ToDate);
    
    let returndata = {};
    
    connection.on('connect', function(err) {
      
      let statement = `SELECT sum(case when cv.FromValue is null then 1 else 0 end) as count_nulls, 
        count(cv.FromValue) as count_valid
        FROM Metadata as md
        LEFT JOIN Measurement as ms
        ON md.MetadataID = ms.MetadataID
        LEFT JOIN ConversionValue as cv
        ON ms.Value = cv.FromValue
        AND cv.ConversionID = @ConversionID
        WHERE md.MetadataID = @MetadataID
        AND ms.CollectedDTM >= @FromDate
        AND ms.CollectedDTM <= @ToDate;`;
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          console.log(err);
          res.status(400).end();
        } else {
          res.status(200).json(returndata);
        }
      });
      
      request.addParameter('ConversionID', TYPES.Int, ConversionID);
      request.addParameter('MetadataID',   TYPES.Int, MetadataID);
      request.addParameter('FromDate',     TYPES.DateTime2, FromDate);
      request.addParameter('ToDate',       TYPES.DateTime2, ToDate);
      
      request.on('row', function(columns) {
        columns.forEach((column) => {
          returndata[[column.metadata.colName]] = column.value;
        });
      });
      
      connection.execSql(request);
    });
  },
  
  convertMeasurements: function(req, res) {
    let mssql_config = cfg.getConfig().mssql;
    let connection = new Connection(mssql_config);
    
    console.log(req.query);
    
    let MetadataID   = req.query.MetadataID;
    let ConversionID = req.query.ConversionID;
    let FromDate     = req.query.FromDate;
    let ToDate       = req.query.ToDate;
    
    let returndata = [];
    
    connection.on('connect', function(err) {
      
      let statement = `SELECT 
          cv.ToValue as Value
          ,cv.FromValue as FromValue
          ,md.[MetadataID]
          ,ms.[MeasurementCommentID]
          ,ms.[MeasurementQualityID]
          ,ms.[QualifierID]
          ,ms.[AddedDate]
          ,ms.[CollectedDTM]
          ,ms.[CollectedDTMOffset]
          ,ms.[CollectedDateTime]
          ,ms.[CollectedDate]
          ,ms.[Depth_M]
        FROM Metadata as md
        LEFT JOIN Measurement as ms
        ON md.MetadataID = ms.MetadataID
        LEFT JOIN ConversionValue as cv
        ON ms.Value = cv.FromValue
        AND cv.ConversionID = @ConversionID
        WHERE md.MetadataID = @MetadataID
        AND ms.CollectedDTM >= @FromDate
        AND ms.CollectedDTM <= @ToDate
        ORDER BY ms.CollectedDateTime ASC;`;
      
      let request = new Request(statement, function(err, rowCount) {
        if (err) {
          console.log(err);
          res.status(400).end();
        } else {
          res.status(200).json(returndata);
        }
      });
      
      request.addParameter('ConversionID', TYPES.Int, ConversionID);
      request.addParameter('MetadataID',   TYPES.Int, MetadataID);
      request.addParameter('FromDate',     TYPES.DateTime2, FromDate);
      request.addParameter('ToDate',       TYPES.DateTime2, ToDate);
      
      request.on('row', function(columns) {
        let newrow = {};
        columns.forEach((column) => {
          newrow[[column.metadata.colName]] = column.value;
        });
        returndata.push(newrow);
      });
      
      connection.execSql(request);
    });
  }
  
};
module.exports = controller;

