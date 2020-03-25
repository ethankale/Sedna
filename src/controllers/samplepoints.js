"use strict";

var Connection = require('tedious').Connection;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
  getSamplePointList: function (req, res) {
    let cfg = require('./config.js')
    let mssql_config = cfg.getConfig().mssql;
    var connection = new Connection(mssql_config);
    
    var statement = `SELECT SamplePointID, st.Code + ': ' + st.Name + ' (' + sp.Name + ')' as Name
      FROM SamplePoint as sp
      INNER JOIN Site as st
      ON sp.SiteID = st.SiteID
      ORDER BY st.Code ASC`
    
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