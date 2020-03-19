"use strict";

const sites        = require('../controllers/sites.js');
const measurements = require('../controllers/measurements.js');

module.exports = function (app) {
    app.get('/',  function(req, res) {
        res.json({ message: 'Alqwu API is working.' });
    });
    
    // No params
    app.get('/api/v1/getsites', sites.getSitesList);
    
    // Parameter: siteid
    app.get('/api/v1/getParamsBySite', sites.getParamsBySite);
    
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurements', measurements.getMeasurements);
    
    // Parameters: metaid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementCount', measurements.getCountByDtmAndMetaid)
    
    // Add one or more new measurements to the database
    app.post('/api/v1/measurements', measurements.addMeasurements);
    
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementDetails', measurements.getDetails);
    
    // Paramter: siteid
    app.get('/api/v1/getMetadatasBySite', sites.getMetadatasBySite);
    
    
};