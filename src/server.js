'use strict';
(function () {
    
    // API using Express
    
    const express = require('express')
    const app = express()
    const port = 3000
    
    const appRoutes = require('./routes/routes.js')(app)
    
    
    app.listen(port, () => console.log(`Server listening on port ${port}!`))

    module.exports = app;

}());