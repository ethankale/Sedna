"use strict";

const equipment           = require('../controllers/equipment.js');
const equipmentModel      = require('../controllers/equipmentModel.js');
const equipmentDeployment = require('../controllers/equipmentDeployment.js');
const metadata            = require('../controllers/metadata.js');
const measurements        = require('../controllers/measurements.js');
const methods             = require('../controllers/methods.js');
const parameters          = require('../controllers/parameters.js');
const samplepoints        = require('../controllers/samplepoints.js');
const test                = require('../controllers/test.js');
const sites               = require('../controllers/sites.js');
const units               = require('../controllers/units.js');
const user                = require('../controllers/user.js');

module.exports = function (app) {
    app.get('/',  function(req, res) {
        res.json({ message: 'Alqwu API is working.' });
    });
    
    app.get('/api/v1/test', test.getTest);

    
    // Equipment Deployments
    app.get('/api/v1/equipmentDeploymentList', equipmentDeployment.getEquipmentDeploymentList);
    app.get('/api/v1/equipmentDeployment',     equipmentDeployment.getEquipmentDeploymentDetails);
    app.put('/api/v1/equipmentDeployment',     equipmentDeployment.updateEquipmentDeployment);
    app.post('/api/v1/equipmentDeployment',    equipmentDeployment.addEquipmentDeployment);
    app.delete('/api/v1/equipmentDeployment',  equipmentDeployment.deleteEquipmentDeployment);
    
    // Equipment
    app.get('/api/v1/equipmentList', equipment.getEquipmentList);
    app.get('/api/v1/equipment',     equipment.getEquipmentDetails);
    app.put('/api/v1/equipment',     equipment.updateEquipment);
    app.post('/api/v1/equipment',    equipment.addEquipment);
    
    // Equipment Models
    app.get('/api/v1/equipmentModelList', equipmentModel.getEquipmentModelList);
    app.get('/api/v1/equipmentModel',     equipmentModel.getEquipmentModelDetails);
    app.put('/api/v1/equipmentModel',     equipmentModel.updateEquipmentModel);
    app.post('/api/v1/equipmentModel',    equipmentModel.addEquipmentModel);
    
    // Measurements
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurements', measurements.getMeasurements);
    // Parameters: metaid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementCount', measurements.getCountByDtmAndMetaid)
    // Add one or more new measurements to the database
    app.post('/api/v1/measurements', measurements.addMeasurements);
    // Parameters: siteid, parameterid, startdtm, enddtm, utcoffset
    app.get('/api/v1/getMeasurementDetails', measurements.getDetails);
    
    // Metadata (or Data Record)
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
    
    // Methods
    app.get('/api/v1/methodList', methods.getMethodList);
    
    // Sample Points
    app.get('/api/v1/samplePointList', samplepoints.getSamplePointList);
    app.get('/api/v1/samplePoint', samplepoints.getSamplePointDetails);
    app.put('/api/v1/samplePoint', samplepoints.updateSamplePoint);
    app.post('/api/v1/samplePoint', samplepoints.addSamplePoint);
    
    // Parameters
    app.get('/api/v1/parameterList', parameters.getParameterList);
    
    // Sites
    app.get('/api/v1/getsites', sites.getSitesList);
    app.get('/api/v1/getParamsBySite', sites.getParamsBySite);
    app.get('/api/v1/site', sites.getSiteDetails);
    app.put('/api/v1/site', sites.updateSite);
    app.post('/api/v1/site', sites.addSite);
    
    // Units
    app.get('/api/v1/unitList', units.getUnitList);
    
    // Users
    app.get('/api/v1/user', user.getUser);
    app.put('/api/v1/user', user.updateUser);
    app.post('/api/v1/user', user.addUser);
    app.get('/api/v1/userList', user.getUserList);
    
};