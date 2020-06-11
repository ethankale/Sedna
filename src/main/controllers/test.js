"use strict";

let Connection = require('tedious').Connection;
let Request    = require('tedious').Request;
let TYPES      = require('tedious').TYPES;

const sqlfunctions = require('./sqlexecutefunction.js')

let controller = {
    getTest: function (req, res) {
        let cfg = require('./config.js')
        let config = cfg.getConfig().mssql;
        
        var connection = new Connection(config);
        var statement = 'SELECT 1';
        
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
