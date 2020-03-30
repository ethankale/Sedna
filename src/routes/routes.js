"use strict";

const sites        = require('../controllers/sites.js');
const measurements = require('../controllers/measurements.js');
const metadata     = require('../controllers/metadata.js');
const samplepoints = require('../controllers/samplepoints.js');
const parameters   = require('../controllers/parameters.js');
const methods      = require('../controllers/methods.js');
const units        = require('../controllers/units.js');
const user         = require('../controllers/user.js');
const test         = require('../controllers/test.js');

module.exports = function (app) {
    app.get('/',  function(req, res) {
        res.json({ message: 'Alqwu API is working.' });
    });
    
    app.get('/api/v1/test', test.getTest);
    
    // Sites
    app.get('/api/v1/getsites', sites.getSitesList);
    app.get('/api/v1/getParamsBySite', sites.getParamsBySite);
    app.get('/api/v1/site', sites.getSiteDetails);
    app.put('/api/v1/site', sites.updateSite);
    app.post('/api/v1/site', sites.addSite);
    
    // Measurements
    
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurements', measurements.getMeasurements);
    
    // Parameters: metaid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementCount', measurements.getCountByDtmAndMetaid)
    
    // Add one or more new measurements to the database
    app.post('/api/v1/measurements', measurements.addMeasurements);
    
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementDetails', measurements.getDetails);
    
    
    // Metadata
    
    // Parameter: siteid
    app.get('/api/v1/getMetadatasBySite', sites.getMetadatasBySite);
    
    // Parameter: active
    app.get('/api/v1/metadataList', metadata.getMetadataList);
    
    // Parameter: metadataid
    app.get('/api/v1/metadataDetails', metadata.getMetadataDetails);
    
    // Parameters: ALL fields in Metadata, including ID
    app.put('/api/v1/metadata', metadata.updateMetadata);
    
    // Parameters: ALL fields in Metadata, EXCEPT ID
    app.post('/api/v1/metadata', metadata.addMetadata);
    
    
    // Sample Points
    app.get('/api/v1/samplePointList', samplepoints.getSamplePointList);
    app.get('/api/v1/samplePoint', samplepoints.getSamplePointDetails);
    
    
    // Parameters
    
    app.get('/api/v1/parameterList', parameters.getParameterList);
    
    
    // Methods
    
    app.get('/api/v1/methodList', methods.getMethodList);
    
    
    // Units
    
    app.get('/api/v1/unitList', units.getUnitList);
    
    // Users
    app.get('/api/v1/user', user.getUser);
    app.put('/api/v1/user', user.updateUser);
    app.post('/api/v1/user', user.addUser);
    app.get('/api/v1/userList', user.getUserList);
    
};