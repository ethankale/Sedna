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

/* Add missing units */
SET IDENTITY_INSERT Alqwu.dbo.[Unit] ON;
GO
INSERT INTO [Alqwu].[dbo].[Unit] (UnitID, Symbol, Description)
SELECT 100, 'mbar', 'Millibars (atmospheric pressure)'
GO
INSERT INTO [Alqwu].[dbo].[Unit] (UnitID, Symbol, Description)
SELECT 101, 'W/m2', 'Watts per square meter (solar radiation)'
GO
INSERT INTO [Alqwu].[dbo].[Unit] (UnitID, Symbol, Description)
SELECT 102, 'mph', 'Miles per hour'
GO
INSERT INTO [Alqwu].[dbo].[Unit] (UnitID, Symbol, Description)
SELECT 103, '°', 'Angle in degrees'
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

/* Add missing parameter(s) */
SET IDENTITY_INSERT Alqwu.dbo.Parameter ON;
GO
INSERT INTO [Alqwu].[dbo].Parameter (ParameterID, Name, Description)
SELECT 10000, 'WINDMAX', 'Wind gust speed (anemometer)'
GO
INSERT INTO [Alqwu].[dbo].Parameter (ParameterID, Name, Description)
SELECT 10001, 'Water level in well (elevation of water depth)', 'Elevation of groundwater'
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

/* Add missing method(s) */
SET IDENTITY_INSERT Alqwu.dbo.[Method] ON;
GO
INSERT INTO [Alqwu].[dbo].[Method] (MethodID, Code, Description)
SELECT 10000, 'WINDDIR', 'Wind direction (anemometer)'
GO
SET IDENTITY_INSERT Alqwu.dbo.[Method] OFF;
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

/* Insert relative humidity metadata 
3172 is the id for the 'Relative Humidity' parameter
1574 is the id for the 'RHumidityLoggerCalc' method
3 is the id for the '%' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT rh.G_ID, 3172, 1574, 3, 1
FROM GDATA.dbo.tblRelativeHumidityGauging as rh
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON rh.G_ID = gl.G_ID
WHERE H_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY rh.G_ID
GO

/* Insert relative humidity measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, H_TimeDate, -480, H_Value, 
   CASE 
   WHEN abs([H_Warning]) > 0 THEN 10 
   WHEN abs([H_Est]) > 0 THEN 17 
   WHEN abs([H_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblRelativeHumidityGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3172
 AND amd.MethodID = 1574
 WHERE H_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY H_TimeDate
GO

/* Insert lake level metadata 
1840 is the id for the 'Lake Stage' parameter
1497 is the id for the 'STAGE-ELEV' method
12 is the id for the 'ft' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT ll.G_ID, 1840, 1497, 12, 1
FROM GDATA.dbo.tblLakeLevelGauging as ll
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON ll.G_ID = gl.G_ID
WHERE L_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY ll.G_ID
GO

/* Insert lake level measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, L_TimeDate, -480, L_Value, 
   CASE 
   WHEN abs([L_Warning]) > 0 THEN 10 
   WHEN abs([L_Est]) > 0 THEN 17 
   WHEN abs([L_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblLakeLevelGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 1840
 AND amd.MethodID = 1497
 WHERE L_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY L_TimeDate
GO

/* Insert well level metadata 
10001 is the id for the 'water level in well (elevation)' parameter (see above)
1509 is the id for the 'water level by pressure transducer' method
12 is the id for the 'ft' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 10001, 1509, 12, 1
FROM GDATA.dbo.tblPiezometerGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE P_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert well level measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, P_TimeDate, -480, P_Value, 
   CASE 
   WHEN abs([P_Warning]) > 0 THEN 10 
   WHEN abs([P_Est]) > 0 THEN 17 
   WHEN abs([P_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblPiezometerGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 10001
 AND amd.MethodID = 1509
 WHERE P_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY P_TimeDate
GO


/* Insert solar radiation metadata 
3242 is the id for the 'local solar radiation' parameter
1610 is the id for the 'solar radiation by pyranometer' method
101 is the id for the 'W/m2' unit (see where this is created in this script above)
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 3242, 1610, 101, 1
FROM GDATA.dbo.tblSolarRadiationGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE S_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert solar radiation measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, S_TimeDate, -480, S_Value, 
   CASE 
   WHEN abs([S_Warning]) > 0 THEN 10 
   WHEN abs([S_Est]) > 0 THEN 17 
   WHEN abs([Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblSolarRadiationGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3242
 AND amd.MethodID = 1610
 WHERE S_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY S_TimeDate
GO

/* Insert air temperature metadata 
3301 is the id for the 'air temperature' parameter
1476 is the id for the 'thermistor' method
6 is the id for the 'W/m2' unit (see where this is created in this script above)
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 3301, 1476, 6, 1
FROM GDATA.dbo.tblAirTempGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE A_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert air temperature measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, A_TimeDate, -480, A_Value, 
   CASE 
   WHEN abs([A_Warning]) > 0 THEN 10 
   WHEN abs([A_Est]) > 0 THEN 17 
   WHEN abs([A_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblAirTempGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3301
 AND amd.MethodID = 1476
 WHERE A_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY A_TimeDate
GO

/* Insert wind speed metadata 
3541 is the id for the 'wind speed' parameter
1629 is the id for the 'wind speed by field meter' method
102 is the id for the 'mph' unit (see where this is created in this script above)
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 3541, 1629, 102, 1
FROM GDATA.dbo.tblWindSpeedGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE Wi_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert wind speed measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, Wi_TimeDate, -480, Wi_Value, 
   CASE 
   WHEN abs([Wi_Warning]) > 0 THEN 10 
   WHEN abs([Wi_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblWindSpeedGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3541
 AND amd.MethodID = 1629
 WHERE Wi_Value IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY Wi_TimeDate
GO

/* Insert wind direction metadata 
3540 is the id for the 'wind direction' parameter
10000 is the id for the 'wind direction' method (created earlier in script)
103 is the id for the '°' unit (see where this is created in this script above)
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 3540, 10000, 103, 1
FROM GDATA.dbo.tblWindSpeedGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE Wi_Direction IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert wind direction measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, Wi_TimeDate, -480, Wi_Direction, 
   CASE 
   WHEN abs([Wi_Warning]) > 0 THEN 10 
   WHEN abs([Wi_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblWindSpeedGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 3540
 AND amd.MethodID = 10000
 WHERE Wi_Direction IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY Wi_TimeDate
GO

/* Insert wind gust metadata 
10000 is the id for the 'wind gust' parameter (see above in script where created)
1629 is the id for the 'wind speed by field meter' method
102 is the id for the 'mph' unit (see where this is created in this script above)
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 10000, 1629, 102, 1
FROM GDATA.dbo.tblWindSpeedGauging as gd
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON gd.G_ID = gl.G_ID
WHERE Wi_Gust_Speed IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY gd.G_ID
GO

/* Insert wind gust measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID)
 SELECT amd.MetadataID, Wi_TimeDate, -480, Wi_Gust_Speed, 
   CASE 
   WHEN abs([Wi_Warning]) > 0 THEN 10 
   WHEN abs([Wi_Provisional]) > 0 THEN 27 
   ELSE NULL END 
   as QualifierID
 FROM [GDATA].[dbo].tblWindSpeedGauging as gdg
 LEFT JOIN Alqwu.dbo.Metadata as amd
 ON amd.SamplePointID = gdg.G_ID
 AND amd.ParameterID = 10000
 AND amd.MethodID = 1629
 WHERE Wi_Gust_Speed IS NOT NULL
 AND amd.SamplePointID IS NOT NULL
 ORDER BY Wi_TimeDate
GO
