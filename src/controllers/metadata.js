"use strict";

var Connection = require('tedious').Connection;
const mssql_config = require('./config.js')

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    
    getMetadataList: function (req, res) {
        var connection = new Connection(mssql_config);
        
        var active    = req.query.active;
        
        var statement = `SELECT md.MetadataID, st.Code + ': ' + st.Name + ' (' + sp.Name + ')' as Metaname
            FROM Metadata as md
            INNER JOIN SamplePoint as sp
            ON md.SamplePointID = sp.SamplePointID
            INNER JOIN Site as st
            ON sp.SiteID = st.SiteID`
            
        if (typeof active != "undefined") {
            statement = statement + " AND Active <> 0"
        }
        
        console.log(statement);
        
        connection.on('connect', function(err) {
          if(err) {
            console.log('Error: ', err)
          } else {
            sqlfunctions.executeSelect(statement, connection, res);
          }
        });
    },
    
    getMetadataDetails: function (req, res) {
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
    
    updateMetadata: function (req, res) {
        
    },
    
    addMetadata: function (req, res) {
        
    }
};

module.exports = controller;