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
    
    //console.log(req.body);
    
    let insertConnection = new Connection(mssql_config);
    let bulkConnection   = new Connection(mssql_config);
    
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
        // insertConnection.close();
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
      // if (lastid != null) {
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
          //console.log(cv_new);
        });
        
        // perform bulk insert
        insertConnection.execBulkLoad(bulkLoad);
      // };
    }
    
    
    // bulkConnection.on('connect', function(err) {
      // if (err) {
        // res.status(400).end();
        // console.log(err);
      // } else {
        // loadBulkData();
      // };
    // });
    
  }
  
};
module.exports = controller;

