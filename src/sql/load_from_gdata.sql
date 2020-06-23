/* Try to keep the transaction log down during bulk insert */
USE master;
ALTER DATABASE Alqwu SET RECOVERY BULK_LOGGED;
DBCC TRACEON(610);
USE Alqwu;
GO

/* Insert users */
SET IDENTITY_INSERT Alqwu.dbo.[User] ON;
GO
INSERT INTO [Alqwu].[dbo].[User] (UserID, Name)
SELECT Data_Processor_ID, Processor_Name
FROM [GDATA].[dbo].[tblDataProcessor]
SET IDENTITY_INSERT Alqwu.dbo.[User] OFF;
GO

/* Insert units */ 
INSERT INTO [Alqwu].[dbo].[Unit] (Symbol, Description)
SELECT symbol, description
FROM [GDATA].[dbo].tblWQUnit;
GO

/* Add a millibar unit, because GData doesn't currently have one */
SET IDENTITY_INSERT Alqwu.dbo.[Unit] ON;
GO
INSERT INTO [Alqwu].[dbo].[Unit] (UnitID, Symbol, Description)
SELECT 100, 'mbar', 'Millibars (atmospheric pressure)'
GO
SET IDENTITY_INSERT Alqwu.dbo.[Unit] OFF;
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
GO

INSERT INTO Alqwu.dbo.Equipment (EquipmentModelID, SerialNumber)
SELECT aem.EquipmentModelID, gi.SerialNumber
FROM GDATA.dbo.Instrument as gi
LEFT JOIN GDATA.dbo.InstrumentType as git
ON gi.InstrumentTypeID = git.InstrumentTypeID
LEFT JOIN Alqwu.dbo.EquipmentModel as aem
on git.Make = aem.Manufacturer AND git.Model = aem.Name
GO

/* Insert qualifiers */
INSERT INTO Alqwu.dbo.Qualifier (Code, Description)
SELECT code, description
FROM GDATA.dbo.tblWQQualifier
GO

/* Insert stage metadata 
3261 is the id for the 'stage' parameter
1522 is the id for the 'recording piezometer' method
12 is the id for the 'feet' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT G_ID, 3261, 1522, 12, 1
FROM GDATA.dbo.tblDischargeGauging
GROUP BY G_ID
GO

/* Insert stage workups */
INSERT INTO Alqwu.dbo.Workup 
  WITH (TABLOCK) 
  (MetadataID, FileName, DataStarts, DataEnds, LoadedOn, UserID)
SELECT DISTINCT amd.MetadataID, FileName, Start_Time, End_Time, AutoDTStamp, WorkedUp_By
FROM [GDATA].[dbo].[tblFlowWorkUpStageTracker] as gwu
  LEFT JOIN Alqwu.dbo.Metadata as amd
  ON gwu.G_ID = amd.SamplePointID
WHERE amd.ParameterID = 3261
  AND amd.MethodID = 1522
GO

/* Insert stage measurements 
   It is vital that: 
   1) there are no indexes on the Measurements table, and
   2) the WITH (TABLOCK) statement is used.  Together, these minimize logging.
   Otherwise, the transaction log can fill up while inserting millions of rows,
   causing insert failure.  The alternative (batching) is abysmally slow.
*/
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
SELECT amd.MetadataID, D_TimeDate, -480, D_Stage, 
  CASE 
	WHEN abs([D_Warning]) > 0 THEN 10 
	WHEN abs([D_Est]) > 0 THEN 17 
	WHEN abs([D_Provisional]) > 0 THEN 27 
	ELSE NULL END 
	as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3261
  AND amd.MethodID = 1522
ORDER BY D_TimeDate
GO

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
GO

/* Insert discharge measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
SELECT amd.MetadataID, D_TimeDate, -480, D_Discharge,   
  CASE 
    WHEN abs([D_Warning]) > 0 THEN 10 
	WHEN abs([D_Est]) > 0 THEN 17 
    WHEN abs([D_Provisional]) > 0 THEN 27 
	ELSE NULL END 
	as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 1548
AND amd.MethodID = 1499
WHERE D_Discharge IS NOT NULL
GO

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
GO

/* Insert temperature measurements */
INSERT INTO Alqwu.dbo.Measurement
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
SELECT amd.MetadataID, W_TimeDate, -480, W_Value, 
  CASE 
    WHEN abs([W_Warning]) > 0 THEN 10 
	WHEN abs([W_Est]) > 0 THEN 17 
    WHEN abs([W_Provisional]) > 0 THEN 27 
	ELSE NULL END 
	as QualifierID
FROM [GDATA].[dbo].[tblWaterTempGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 3307
AND amd.MethodID = 1476
WHERE W_Value IS NOT NULL
GO

/* Insert barometric pressure metadata 
740 is the id for the 'barometric pressure' parameter
1458 is the id for the 'barometric pressure using barometer' method
100 is the id for the 'millibar' unit, created during database setup
*/
INSERT INTO Alqwu.dbo.Metadata 
  WITH (TABLOCK)
  (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT bg.G_ID, 740, 1458, 100, 1
FROM GDATA.dbo.tblBarometerGauging as bg
LEFT JOIN GDATA.dbo.tblGaugeLLID as gl
ON bg.G_ID = gl.G_ID
WHERE B_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY bg.G_ID
GO

/* Insert barometer measurements */
INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
SELECT amd.MetadataID, B_TimeDate, -480, B_Value, 
  CASE 
    WHEN abs([B_Warning]) > 0 THEN 10 
	WHEN abs([B_Est]) > 0 THEN 17 
    WHEN abs([B_Provisional]) > 0 THEN 27 
	ELSE NULL END 
	as QualifierID
FROM [GDATA].[dbo].[tblBarometerGauging] as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
AND amd.ParameterID = 740
AND amd.MethodID = 1458
WHERE B_Value IS NOT NULL
GO

/* Insert rainfall metadata 
3090 is the id for the 'Precipitation' parameter
1527 is the id for the 'Rain gage' method
14 is the id for the 'in' (inches) unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT rg.G_ID, 3090, 1527, 14, 1
FROM GDATA.dbo.tblRainGauging as rg
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON rg.G_ID = gl.G_ID
WHERE R_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY rg.G_ID
GO

/* Insert rainfall measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, R_TimeDate, -480, R_Value, 
   CASE 
   WHEN abs([R_Warning]) > 0 THEN 10 
   WHEN abs([R_Est]) > 0 THEN 17 
   WHEN abs([Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblRainGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3090
 AND amd.MethodID = 1527
 WHERE R_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY R_TimeDate
GO