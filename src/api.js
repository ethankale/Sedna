'use strict';
(function () {
    
    // API using Express
    
    const sql = require('mssql');
    const mssql_config = require('./config.js')
    
    //const sql = require('msnodesqlv8');
    
    const express = require('express')
    const app = express()
    const port = 3000
    
    //  What to return from the root
    app.get('/', function (req, res) {
        
        sql.connect(mssql_config, function(err) {
            
            if(err) console.log(err);
            var request = new sql.Request();
            
            request.query('select COUNT(*) from tblGaugeLLID', function(err, recordset) {
                if(err) console.log(err);
                res.send(recordset);
            });
        });
    });

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))

    module.exports = app;

}());