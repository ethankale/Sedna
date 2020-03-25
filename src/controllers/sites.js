
"use strict";

var Connection = require('tedious').Connection;

const sqlfunctions = require('./sqlexecutefunction.js')


let controller = {
    getSitesList: function (req, res) {
        let cfg = require('./config.js')
        let mssql_config = cfg.getConfig().mssql;
        var connection = new Connection(mssql_config);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect("SELECT SiteID, Code, Name FROM Site", connection, res);
          }
        });
    },
    
    getParamsBySite: function (req, res) {
        let cfg = require('./config.js')
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
        let cfg = require('./config.js')
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