'use strict';
(function () {
    
    // API using Express
    
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.allowRendererProcessReuse = true;
    
    // This is hard-coded into the entire front end, so that's not great.
    //   Should probably work on abstracting that out.  Ideally this would
    //   be a user setting, so if there's a conflict a user could change it.
    const port = 3000;
    
    const appRoutes = require('./routes/routes.js')(app)
    
    app.listen(port, () => console.log(`Server listening on port ${port}!`))

    module.exports = app;

}());