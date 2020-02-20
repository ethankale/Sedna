
/* Insert units */ 
INSERT INTO [Alqwu].[dbo].[Unit] (Symbol, Description)
SELECT symbol, description
FROM [GDATA].[dbo].tblWQUnit;
GO

/* Insert parameters */
SET IDENTITY_INSERT Alqwu.dbo.Parameter ON;
GO
INSERT INTO Alqwu.dbo.Parameter (ParameterID, Name, Description, CAS)
SELECT id, name, notes, CAS
FROM GDATA.dbo.tblWQParameter;
GO
SET IDENTITY_INSERT Alqwu.dbo.Parameter OFF;
GO

/* Insert methods */
SET IDENTITY_INSERT Alqwu.dbo.Method ON;
GO
INSERT INTO Alqwu.dbo.Method (MethodID, Code, Description, Reference)
SELECT id, code, left(description, 255) as description, left(reference, 255) as reference
FROM GDATA.dbo.tblWQMethod;
GO
SET IDENTITY_INSERT Alqwu.dbo.Method OFF;
GO

/* Insert sites */
SET IDENTITY_INSERT Alqwu.dbo.Site ON;
GO
INSERT INTO Alqwu.dbo.Site (SiteID, Code, Name, Address)
SELECT G_ID, SITE_CODE, SITE_NAME, Address 
FROM gdata.dbo.tblGaugeLLID
GO
SET IDENTITY_INSERT Alqwu.dbo.Site OFF;
GO

/* Insert sample points.  Assume one sample point per site.  */
SET IDENTITY_INSERT Alqwu.dbo.SamplePoint ON;
GO
INSERT INTO Alqwu.dbo.SamplePoint (SamplePointID, SiteID, Name, Latitude, Longitude, ElevationFeet, ElevationDatum, ElevationReference)
SELECT G_ID, G_ID, 'Default' as Name, LAT, LON, Elevation, Vert_datum, Elevation_of
FROM gdata.dbo.tblGaugeLLID
SET IDENTITY_INSERT Alqwu.dbo.SamplePoint OFF;
GO

/* Insert equipment types */
INSERT INTO Alqwu.dbo.EquipmentModel (Name, Manufacturer)
SELECT model, make
FROM GDATA.dbo.InstrumentType;
GO

INSERT INTO Alqwu.dbo.EquipmentModel (Name, Manufacturer)
SELECT model, make
FROM GDATA.dbo.LoggerType;
GO

/* Insert equipment */
INSERT INTO Alqwu.dbo.Equipment (EquipmentModelID, SerialNumber)
SELECT aem.EquipmentModelID, gl.SerialNumber
FROM GDATA.dbo.Logger as gl
LEFT JOIN GDATA.dbo.LoggerType as glt
ON gl.LoggerTypeID = glt.LoggerTypeID
LEFT JOIN Alqwu.dbo.EquipmentModel as aem
on glt.Make = aem.Manufacturer AND glt.Model = aem.Name

INSERT INTO Alqwu.dbo.Equipment (EquipmentModelID, SerialNumber)
SELECT aem.EquipmentModelID, gi.SerialNumber
FROM GDATA.dbo.Instrument as gi
LEFT JOIN GDATA.dbo.InstrumentType as git
ON gi.InstrumentTypeID = git.InstrumentTypeID
LEFT JOIN Alqwu.dbo.EquipmentModel as aem
on git.Make = aem.Manufacturer AND git.Model = aem.Name

/* Insert qualifiers */
INSERT INTO Alqwu.dbo.Qualifier (Code, Description)
SELECT code, description
FROM GDATA.dbo.tblWQQualifier

/* Insert stage metadata 
3261 is the id for the 'stage' parameter
1522 is the id for the 'recording piezometer' method
12 is the id for the 'feet' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT G_ID, 3261, 1522, 12, 1
FROM GDATA.dbo.tblDischargeGauging
GROUP BY G_ID

/* Insert stage workups */
INSERT INTO Alqwu.dbo.Workup (MetadataID, FileName, DataStarts, DataEnds, LoadedOn)
SELECT DISTINCT amd.MetadataID, FileName, Start_Time, End_Time, AutoDTStamp
FROM [GDATA].[dbo].[tblFlowWorkUpStageTracker] as gwu
LEFT JOIN Alqwu.dbo.Metadata as amd
ON gwu.G_ID = amd.SamplePointID
WHERE amd.ParameterID = 3261
AND amd.MethodID = 1522

/* Insert stage measurements 
CAUTION there is more work to do here.
This doesn't handle warning, lock, or provisional values.
*/

INSERT INTO Alqwu.dbo.Measurement (MetadataID, CollectedDtm, Value, QualifierID)
SELECT amd.MetadataID, D_TimeDate, D_Stage, CASE WHEN abs([D_Est]) > 0 THEN 7 ELSE NULL END as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 3261
AND amd.MethodID = 1522

/* Insert discharge metadata 
1548 is the id for the 'Flow' parameter
1499 is the id for the 'streamflow from stage-discharge' method
7 is the id for the 'cfs' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT G_ID, 1548, 1499, 7, 1
FROM GDATA.dbo.tblDischargeGauging
WHERE D_Discharge IS NOT NULL
GROUP BY G_ID

/* Insert stage measurements 
CAUTION there is more work to do here.
This doesn't handle warning, lock, or provisional values.
*/
INSERT INTO Alqwu.dbo.Measurement (MetadataID, CollectedDtm, Value, QualifierID)
SELECT amd.MetadataID, D_TimeDate, D_Discharge, CASE WHEN abs([D_Est]) > 0 THEN 7 ELSE NULL END as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 1548
AND amd.MethodID = 1499

/* Insert water temp metadata 
3307 is the id for the 'water temperature' parameter
1476 is the id for the 'temperature by thermistor' method
6 is the id for the 'degrees C' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT G_ID, 3307, 1476, 6, 1
FROM GDATA.dbo.tblWaterTempGauging
WHERE W_Value IS NOT NULL
GROUP BY G_ID

/* Insert temperature measurements 
CAUTION there is more work to do here.
This doesn't handle warning, lock, or provisional values.
*/
INSERT INTO Alqwu.dbo.Measurement (MetadataID, CollectedDtm, Value, QualifierID)
SELECT amd.MetadataID, W_TimeDate, W_Value, CASE WHEN abs([W_Est]) > 0 THEN 7 ELSE NULL END as QualifierID
FROM [GDATA].[dbo].[tblWaterTempGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 3307
AND amd.MethodID = 1476
