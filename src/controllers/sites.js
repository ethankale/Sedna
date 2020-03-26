
"use strict";

let { Connection, TYPES, Request} = require('tedious');
let cfg        = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getSiteDetails: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      var connection = new Connection(mssql_config);
      
      let siteid    = req.query.siteid;
      
      let returndata = [];
      
      connection.on('connect', function(err) {
        if(err) {
          console.log('Error: ', err)
          res.status(400).end();
        } 
        
        let statement = `SELECT
          st.Code, st.Name, st.Address, st.City, st.ZipCode, st.Active, st.Description, 
          COUNT(DISTINCT sp.SamplePointID) as SamplePointCount, COUNT(md.MetadataID) as MetadataCount
          FROM Site as st
          LEFT JOIN SamplePoint as sp
          ON st.SiteID = sp.SiteID
          LEFT JOIN Metadata as md
          ON sp.SamplePointID = md.SamplePointID
          WHERE st.SiteID = @siteid
          GROUP BY st.Code, st.Name, st.Address, st.City, st.ZipCode, st.Active, st.Description`;
        
        var request = new Request(statement, function(err, rowCount) {
          if (err) {
            res.status(400).end();
            console.log(err);
          } else {
            res.status(200).json(returndata);
          }
          connection.close();
        });
        
        request.addParameter('siteid', TYPES.Int, req.query.siteid);
        
        request.on('row', function(columns) {
          let thisrow = {}
          columns.forEach(function(column) {
              thisrow[[column.metadata.colName]] = column.value;
          });
          returndata.push(thisrow);
        });
        
        connection.execSql(request);
      });
    },
    
    getSitesList: function (req, res) {
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        let statement = "SELECT SiteID, Code, Name FROM Site";
        if (typeof req.query.active != 'undefined') {
          let active = req.query.active == 1 ? 1 : 0;
          statement += " WHERE Active = " + req.query.active;
        }
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    updateSite: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      let returndata = {};
      
      let statement = `UPDATE [Site] SET
        Code        = @Code,
        Name        = @name,
        Address     = @address,
        City        = @city,
        ZipCode     = @zip,
        Description = @description
        WHERE SiteID = @siteid\r`;
      
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
        
        request.addParameter('siteid', TYPES.Int, req.body.siteid);
        request.addParameter('code', TYPES.VarChar, req.body.code);
        request.addParameter('name', TYPES.VarChar, req.body.name);
        request.addParameter('address', TYPES.VarChar, req.body.address);
        request.addParameter('city', TYPES.VarChar, req.body.city);
        request.addParameter('zip', TYPES.VarChar, req.body.zip);
        request.addParameter('description', TYPES.VarChar, req.body.description);
        
        connection.execSql(request);
      });
    },
    
    addSite: function(req, res) {
      let mssql_config = cfg.getConfig().mssql;
      let connection = new Connection(mssql_config);
      
      let lastid = 0;
      
      let statement = `INSERT INTO [Site]
        (Code, Name, Address, City, ZipCode, Description)
        VALUES (@code, @name, @address, @city, @zip, @description);
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
        
        request.addParameter('code', TYPES.VarChar, req.body.code);
        request.addParameter('name', TYPES.VarChar, req.body.name);
        request.addParameter('address', TYPES.VarChar, req.body.address);
        request.addParameter('city', TYPES.VarChar, req.body.city);
        request.addParameter('zip', TYPES.VarChar, req.body.zip);
        request.addParameter('description', TYPES.VarChar, req.body.description);
        
        connection.execSql(request);
      });
    },
    
    getParamsBySite: function (req, res) {
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        var statement = `SELECT SiteID, ParameterID, MethodID, Name, Method, maxdtm, mindtm, nmeasure
          FROM [Measurement_By_SamplePoint_v]
          WHERE SiteID = ${req.query.siteid}
          ORDER BY Name`
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    getMetadatasBySite: function (req, res) {
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        var siteid    = req.query.siteid;
        
        var statement = `SELECT md.MetadataID, sp.SiteID, md.ParameterID, pm.Name as Parameter, 
        md.MethodID, mt.Code as Method, md.UnitID, un.Symbol as Unit, FrequencyMinutes, DecimalPoints
        FROM Metadata as md
        INNER JOIN SamplePoint as sp
        ON md.SamplePointID = sp.SamplePointID
        INNER JOIN Parameter as pm
        ON pm.ParameterID = md.ParameterID
        INNER JOIN Method as mt
        ON mt.MethodID = md.MethodID
        INNER JOIN Unit as un
        ON un.UnitID = md.UnitID
        WHERE sp.SiteID = ${siteid}
        AND md.Active = 1`
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    }
    
};

module.exports = controller;