"use strict";

const conversion          = require('../controllers/conversion.js');
const equipment           = require('../controllers/equipment.js');
const equipmentModel      = require('../controllers/equipmentModel.js');
const equipmentDeployment = require('../controllers/equipmentDeployment.js');
const metadata            = require('../controllers/metadata.js');
const measurements        = require('../controllers/measurements.js');
const method              = require('../controllers/method.js');
const parameter           = require('../controllers/parameter.js');
const samplepoints        = require('../controllers/samplepoints.js');
const test                = require('../controllers/test.js');
const sites               = require('../controllers/sites.js');
const unit                = require('../controllers/unit.js');
const qualifier           = require('../controllers/qualifier.js');
const user                = require('../controllers/user.js');

module.exports = function (app) {
    app.get('/',  function(req, res) {
        res.json({ message: 'Alqwu API is working.' });
    });
    
    app.get('/api/v1/test', test.getTest);

    
    // Conversions
    app.get('/api/v1/conversionList', conversion.getConversionList);
    app.get('/api/v1/conversion',     conversion.getConversion);
    app.put('/api/v1/conversion',     conversion.updateConversion);
    app.post('/api/v1/conversion',    conversion.addConversion);
    
    app.get('/api/v1/conversionStats',     conversion.conversionStats);
    app.get('/api/v1/convertMeasurements', conversion.convertMeasurements);
    
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
    app.get('/api/v1/getMeasurements',       measurements.getMeasurements);
    app.get('/api/v1/getMeasurementCount',   measurements.getCountByDtmAndMetaid)
    app.post('/api/v1/measurements',         measurements.addMeasurements);
    app.get('/api/v1/getMeasurementDetails', measurements.getDetails);
    app.get('/api/v1/getMeasurementsRaw',    measurements.getRawMeasurements);
    app.delete('/api/v1/measurements',       measurements.deleteMeasurements);
    
    // Metadata (or Data Record)
    app.get('/api/v1/getMetadatasBySite',   sites.getMetadatasBySite);
    app.get('/api/v1/metadataList',         metadata.getMetadataList);
    app.get('/api/v1/metadataDetails',      metadata.getMetadataDetails);
    app.put('/api/v1/metadata',             metadata.updateMetadata);
    app.post('/api/v1/metadata',            metadata.addMetadata);
    
    // Methods
    app.get('/api/v1/methodList',   method.getMethodList);
    app.get('/api/v1/method',       method.getMethodDetails);
    app.put('/api/v1/method',       method.updateMethod);
    app.post('/api/v1/method',      method.addMethod);
    
    // Sample Points
    app.get('/api/v1/samplePointList',  samplepoints.getSamplePointList);
    app.get('/api/v1/samplePoint',      samplepoints.getSamplePointDetails);
    app.put('/api/v1/samplePoint',      samplepoints.updateSamplePoint);
    app.post('/api/v1/samplePoint',     samplepoints.addSamplePoint);
    
    // Parameters
    app.get('/api/v1/parameterList',    parameter.getParameterList);
    app.get('/api/v1/parameter',        parameter.getParameterDetails);
    app.put('/api/v1/parameter',        parameter.updateParameter);
    app.post('/api/v1/parameter',       parameter.addParameter);
    
    // Sites
    app.get('/api/v1/getsites',         sites.getSitesList);
    app.get('/api/v1/getParamsBySite',  sites.getParamsBySite);
    app.get('/api/v1/site',             sites.getSiteDetails);
    app.put('/api/v1/site',             sites.updateSite);
    app.post('/api/v1/site',            sites.addSite);
    
    // Units
    app.get('/api/v1/unitList', unit.getUnitList);
    app.get('/api/v1/unit',     unit.getUnitDetails);
    app.put('/api/v1/unit',     unit.updateUnit);
    app.post('/api/v1/unit',    unit.addUnit);
    
    // Qualifier
    app.get('/api/v1/qualifierList',    qualifier.getQualifierList);
    app.get('/api/v1/qualifier',        qualifier.getQualifierDetails);
    app.put('/api/v1/qualifier',        qualifier.updateQualifier);
    app.post('/api/v1/qualifier',       qualifier.addQualifier);
    
    // Users
    app.get('/api/v1/userList', user.getUserList);
    app.get('/api/v1/user',     user.getUser);
    app.put('/api/v1/user',     user.updateUser);
    app.post('/api/v1/user',    user.addUser);
    
};