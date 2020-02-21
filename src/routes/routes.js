"use strict";

const ctrl = require('../controllers/sites.js');
module.exports = function (app) {
    
    app.get('/',  function(req, res) {
        res.json({ message: 'Alqwu API is working.' });
    });
    
    app.get('/api/v1/getsites', ctrl.getData);
};