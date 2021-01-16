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

  This uses existing workups as metadata records.
  
  Works as follows: start by selecting workups from GData.  Since in GData all
  workups are saved, a single measurement might have multiple associated 
  workups if a user uploaded a file multiple times (deleting the last set 
  of uploaded measurements each time).
  
  This query addresses that by selecting only the most recent workup 
  using a pair of common table expression (cte).  The first checks whether
  the start date and G_ID are identical; the second checks whether the end date
  and G_ID are identical.  It works that way because sometimes a user tweaked the
  start or end date of a file during upload.  This way it's much less likely
  that you'll get overlapping metadata records.
  
  
 */
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3261 as ParameterID, 12 as UnitID, gwu.Comments as Notes, 
    1522 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUpDate as CreatedOn, SensorOffset as CorrectionOffset, SensorCorrLog as CorrectionStepChange,
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUpDate DESC) AS RowNum
  FROM [GDATA].[dbo].[tblFlowWorkUpStageTracker] as gwu ),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn, CorrectionOffset, CorrectionStepChange)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn, CorrectionOffset, CorrectionStepChange 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Insert stage measurements 
  This only inserts data with matching metadata, which means there will
  be gaps.
  
  You will have to manually review the data for gaps, and re-upload it from
  GData if it's missing.
  
  A common issue is running into duplicates.  A common reason for that is
  the UTC offset.  If your data in GDATA have an incorrect UTC offset applied,
  there will be overlapping data when you try to upload them.  I have been 
  setting all the UTC offset values to 8, because we do everything in PST.
  
*/
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT amd.MetadataID, 
  dateadd(hour, D_UTCOffset, D_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  D_Stage as Value, D_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([D_Warning]) > 0 THEN 10 
  WHEN abs([D_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3261
  AND amd.MethodID = 1522
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.D_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.D_TimeDate
WHERE MetadataID IS NOT NULL
GO

/* Insert discharge metadata 
1548 is the id for the 'Flow' parameter
1499 is the id for the 'streamflow from stage-discharge' method
7 is the id for the 'cfs' unit
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 1548 as ParameterID, 7 as UnitID, gwu.Comments as Notes, 
    1499 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUpDate as CreatedOn, SensorOffset as CorrectionOffset, SensorCorrLog as CorrectionStepChange,
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUpDate DESC) AS RowNum
  FROM [GDATA].[dbo].[tblFlowWorkUpStageTracker] as gwu
    WHERE G_ID > 0),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn, CorrectionOffset, CorrectionStepChange)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn, CorrectionOffset, CorrectionStepChange 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO


/* Insert discharge measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT amd.MetadataID, 
  dateadd(hour, D_UTCOffset, D_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  D_Discharge as Value, D_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([D_Warning]) > 0 THEN 10 
  WHEN abs([D_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblDischargeGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 1548
  AND amd.MethodID = 1499
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.D_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.D_TimeDate
WHERE MetadataID IS NOT NULL
  AND D_Discharge IS NOT NULL
GO

/* Insert water temp metadata 
3307 is the id for the 'water temperature' parameter
1476 is the id for the 'temperature by thermistor' method
6 is the id for the 'degrees C' unit
3 is the GData parameter id for water temperature
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3307 as ParameterID, 6 as UnitID, gwu.WorkUp_Notes as Notes, 
    1476 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    gwu.WorkUp_Notes as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
    WHERE G_ID > 0
    AND Parameter = 3),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO


/* Insert temperature measurements */

  -- UPDATE [GDATA].[dbo].[tblWaterTempGauging]
  -- SET W_UTCOffset = 8

INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, W_UTCOffset, W_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  W_Value as Value, W_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([W_Warning]) > 0 THEN 10 
  WHEN abs([W_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblWaterTempGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3307
  AND amd.MethodID = 1476
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.W_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.W_TimeDate
WHERE MetadataID IS NOT NULL
  AND W_Value IS NOT NULL
GO

/* Insert barometric pressure metadata 
740 is the id for the 'barometric pressure' parameter
1458 is the id for the 'barometric pressure using barometer' method
100 is the id for the 'millibar' unit, created during database setup
10 is the GData parameter id for barometric pressure
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 740 as ParameterID, 100 as UnitID, gwu.WorkUp_Notes as Notes, 
    1458 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    gwu.WorkUp_Notes as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
    WHERE G_ID > 0
    AND Parameter = 10),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblBarometerGauging]
SET B_UTCOffset = 8

/* Insert barometer measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, B_UTCOffset, B_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  B_Value as Value, B_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([B_Warning]) > 0 THEN 10 
  WHEN abs([B_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblBarometerGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 740
  AND amd.MethodID = 1458
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.B_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.B_TimeDate
WHERE MetadataID IS NOT NULL
  AND B_Value IS NOT NULL
GO

/* Insert rainfall metadata 
3090 is the id for the 'Precipitation' parameter
1527 is the id for the 'Rain gage' method
14 is the id for the 'in' (inches) unit
1 is the GData parameter id for barometric pressure
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3090 as ParameterID, 14 as UnitID, gwu.WorkUp_Notes as Notes, 
    1527 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    gwu.WorkUp_Notes as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 1),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblRainGauging]
SET R_UTCOffset = 8

/* Insert rainfall measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, R_UTCOffset, R_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  R_Value as Value, Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([R_Warning]) > 0 THEN 10 
  WHEN abs([R_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblRainGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3090
  AND amd.MethodID = 1527
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.R_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.R_TimeDate
WHERE MetadataID IS NOT NULL
  AND R_Value IS NOT NULL
GO


/* Insert relative humidity metadata 
3172 is the id for the 'Relative Humidity' parameter
1574 is the id for the 'RHumidityLoggerCalc' method
3 is the id for the '%' unit
34 is the GData parameter id for relative humidity
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3172 as ParameterID, 3 as UnitID, gwu.WorkUp_Notes as Notes, 
    1574 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    gwu.WorkUp_Notes as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 34),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO


/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblRelativeHumidityGauging]
SET H_UTCOffset = 8

/* Insert relative humidity measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, H_UTCOffset, H_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  H_Value as Value, H_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([H_Warning]) > 0 THEN 10 
  WHEN abs([H_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblRelativeHumidityGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3172
  AND amd.MethodID = 1574
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.H_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.H_TimeDate
WHERE MetadataID IS NOT NULL
  AND H_Value IS NOT NULL
GO

/* Insert lake level metadata 
1840 is the id for the 'Lake Stage' parameter
1497 is the id for the 'STAGE-ELEV' method
12 is the id for the 'ft' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active, FrequencyMinutes)
SELECT ll.G_ID, 1840, 1497, 12, 1, 60
FROM GDATA.dbo.tblLakeLevelGauging as ll
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
ON ll.G_ID = gl.G_ID
WHERE L_Value IS NOT NULL
AND gl.G_ID IS NOT NULL
GROUP BY ll.G_ID
GO

/* As far as I could tell, there aren't any lake level workups.
  I could be missing something.
*/

/* Insert lake level measurements */
 INSERT INTO Alqwu.dbo.Measurement 
 WITH (TABLOCK)
 (MetadataID, CollectedDtm, CollectedDTMOffset, Value, QualifierID, Provisional)
 SELECT amd.MetadataID, L_TimeDate, -480, L_Value, 
   CASE 
   WHEN abs([L_Warning]) > 0 THEN 10 
   WHEN abs([L_Est]) > 0 THEN 17 
   ELSE NULL END 
   as QualifierID,
   L_Provisional
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
36 is the GData parameter id for well level (piezometer)
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 10001 as ParameterID, 12 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    1509 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 36),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblPiezometerGauging]
SET P_UTCOffset = 8

/* Insert well level measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, P_UTCOffset, P_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  P_Value as Value, P_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([P_Warning]) > 0 THEN 10 
  WHEN abs([P_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblPiezometerGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 10001
  AND amd.MethodID = 1509
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.P_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.P_TimeDate
WHERE MetadataID IS NOT NULL
  AND P_Value IS NOT NULL
GO

/* Insert solar radiation metadata 
3242 is the id for the 'local solar radiation' parameter
1610 is the id for the 'solar radiation by pyranometer' method
101 is the id for the 'W/m2' unit (see where this is created in this script above)
32 is the GData parameter id for solar radiation
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3242 as ParameterID, 101 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    1610 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 32),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblSolarRadiationGauging]
SET S_UTCOffset = 8

/* Insert solar radiation measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, S_UTCOffset, S_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  S_Value as Value, Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([S_Warning]) > 0 THEN 10 
  WHEN abs([S_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblSolarRadiationGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3242
  AND amd.MethodID = 1610
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.S_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.S_TimeDate
WHERE MetadataID IS NOT NULL
  AND S_Value IS NOT NULL
GO

/* Insert air temperature metadata 
3301 is the id for the 'air temperature' parameter
1476 is the id for the 'thermistor' method
6 is the id for the 'W/m2' unit (see where this is created in this script above)
4 is the GData parameter id for air temperature (c)
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3301 as ParameterID, 6 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    1476 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 4),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblAirTempGauging]
SET A_UTCOffset = 8

/* Insert air temperature measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, A_UTCOffset, A_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  A_Value as Value, A_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([A_Warning]) > 0 THEN 10 
  WHEN abs([A_Est]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblAirTempGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3301
  AND amd.MethodID = 1476
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.A_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.A_TimeDate
WHERE MetadataID IS NOT NULL
  AND A_Value IS NOT NULL
GO

/* Insert wind speed metadata 
3541 is the id for the 'wind speed' parameter
1629 is the id for the 'wind speed by field meter' method
102 is the id for the 'mph' unit (see where this is created in this script above)
33 is the GData parameter id for "wind".  This is the same for direction, speed, and gust.
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3541 as ParameterID, 102 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    1629 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 4),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Comment this out if you don't want to change UTC Offset values */
UPDATE [GDATA].[dbo].[tblAirTempGauging]
SET A_UTCOffset = 8

/* Insert wind speed measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, Wi_UTCOffset, Wi_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  Wi_Value as Value, Wi_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([Wi_Warning]) > 0 THEN 10 
  WHEN abs([Wi_Estimate]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblWindSpeedGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3541
  AND amd.MethodID = 1629
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.Wi_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.Wi_TimeDate
WHERE MetadataID IS NOT NULL
  AND Wi_Value IS NOT NULL
GO


/* Insert wind direction metadata 
3540 is the id for the 'wind direction' parameter
10000 is the id for the 'wind direction' method (created earlier in script)
103 is the id for the '°' unit (see where this is created in this script above)
33 is the GData parameter id for "wind".  This is the same for direction, speed, and gust.
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 3540 as ParameterID, 103 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    10000 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 33),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Insert wind direction measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, Wi_UTCOffset, Wi_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  Wi_Direction as Value, Wi_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([Wi_Warning]) > 0 THEN 10 
  WHEN abs([Wi_Estimate]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblWindSpeedGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 3540
  AND amd.MethodID = 10000
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.Wi_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.Wi_TimeDate
WHERE MetadataID IS NOT NULL
  AND Wi_Direction IS NOT NULL
GO

/* Insert wind gust metadata 
10000 is the id for the 'wind gust' parameter (see above in script where created)
1629 is the id for the 'wind speed by field meter' method
102 is the id for the 'mph' unit (see where this is created in this script above)
33 is the GData parameter id for "wind".  This is the same for direction, speed, and gust.
*/
WITH gd_rows AS (
  SELECT G_ID as SamplePointID, 10000 as ParameterID, 102 as UnitID, left(gwu.WorkUp_Notes, 254) as Notes, 
    1629 as MethodID, 1 as Active, 15 as FrequencyMinutes, 2 as DecimalPoints,  null as GraphTypeID,
    left(gwu.WorkUp_Notes, 254) as FileName, Start_Time as DataStarts, End_Time as DataEnds, gwu.WorkedUp_By as UserID, 
    WorkUp_Date as CreatedOn, 
    ROW_NUMBER() OVER (
      PARTITION BY G_ID, Start_Time
      ORDER BY WorkUp_Date DESC) AS RowNum
  FROM [GDATA].[dbo].[tblWorkUpTransactions] as gwu
  LEFT JOIN Alqwu.dbo.SamplePoint as asp
    ON gwu.G_ID = asp.SamplePointID
  WHERE gwu.G_ID > 0
    AND asp.SamplePointID IS NOT NULL
    AND Parameter = 33),
  gd_rows2 AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY SamplePointID, DataEnds
      ORDER BY CreatedOn DESC) AS RowNum2
  FROM gd_rows as gwu )
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn)
SELECT SamplePointID, ParameterID, UnitID, Notes,
  MethodID, Active, FrequencyMinutes, DecimalPoints, GraphTypeID,
  FileName, DataStarts, DataEnds, UserID,
  CreatedOn 
FROM gd_rows2
WHERE RowNum = 1 and RowNum2 = 1
GO

/* Insert wind gust measurements */
INSERT INTO Alqwu.dbo.Measurement 
  WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Provisional, Symbol, QualifierID)
SELECT DISTINCT amd.MetadataID, 
  dateadd(hour, Wi_UTCOffset, Wi_TimeDate) as CollectedDTM, -480 as CollectedDTMOffset, 
  Wi_Gust_Speed as Value, Wi_Provisional as Provisional, '=' as Symbol,
  CASE 
  WHEN abs([Wi_Warning]) > 0 THEN 10 
  WHEN abs([Wi_Estimate]) > 0 THEN 17 
  ELSE NULL END 
  as QualifierID
FROM [GDATA].[dbo].[tblWindSpeedGauging] as gdg
  LEFT JOIN Alqwu.dbo.Metadata as amd
ON amd.SamplePointID = gdg.G_ID
  AND amd.ParameterID = 10000
  AND amd.MethodID = 1629
  AND dateadd(hour,-8,amd.DataEnds) >= gdg.Wi_TimeDate
  AND dateadd(hour,-8,amd.DataStarts) <= gdg.Wi_TimeDate
WHERE MetadataID IS NOT NULL
  AND Wi_Gust_Speed IS NOT NULL
GO

/* Water quality - start by deleting duplicates, which I failed to prevent
   because the indexes in GData were not defined correctly.
*/
DELETE
FROM [GDATA].[dbo].tblWQResult
WHERE id NOT IN (
  SELECT MAX(id)
  FROM [GDATA].[dbo].tblWQResult as gdg
  GROUP BY gdg.gid, gdg.param_id, gdg.method_id, sample_datetime, sample_utc_offset, depth_m, dup
);

/* Insert water quality metadata 
  param_id and method_id in GData are the same as ParameterID and MethodID in Alqwu
  unit is text in GData but an ID in Alqwu - but the text in GData is the same as the Symbol in Alqwu
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active, DecimalPoints)
SELECT DISTINCT gid, param_id, method_id, au.UnitID, 1, 3
FROM [GDATA].[dbo].[tblWQResult] as gm
LEFT JOIN Alqwu.dbo.Unit as au
  ON gm.unit = au.Symbol
LEFT JOIN GDATA.dbo.tblGaugeLLID gl
  ON gm.gid = gl.G_ID
WHERE gl.G_ID IS NOT NULL
GO

/* Insert water quality measurements */
INSERT INTO Alqwu.dbo.Measurement 
WITH (TABLOCK)
(MetadataID, CollectedDtm, CollectedDTMOffset, Value, Depth_M, Duplicate, LabBatch, QualifierID)
SELECT DISTINCT amd.MetadataID, sample_datetime, sample_utc_offset, value, depth_m, dup, lab_batch, aql.QualifierID
FROM [GDATA].[dbo].tblWQResult as gdg
LEFT JOIN Alqwu.dbo.Metadata as amd
  ON amd.SamplePointID = gdg.gid
  AND amd.ParameterID = gdg.param_id
  AND amd.MethodID = gdg.method_id
LEFT JOIN Alqwu.dbo.Qualifier as aql
  ON aql.Code = gdg.qualifier
WHERE sample_datetime > '1900-01-02'
AND amd.SamplePointID IS NOT NULL
GO

/* Generally speaking the water quality parameters should be graphed with points;
   points are id #3. */
UPDATE Alqwu.dbo.Method
SET GraphTypeID = 3
WHERE MethodID IN (
  SELECT DISTINCT method_id
  FROM GDATA.dbo.tblWQResult)

/* Insert manual discharge metadata 
1548 is the id for the 'Flow' parameter
1535 is the id for the 'Streamflow by acoustic doppler velocimeter' method
7 is the id for the 'cfs' unit
*/
INSERT INTO Alqwu.dbo.Metadata (SamplePointID, ParameterID, MethodID, UnitID, Active)
SELECT gd.G_ID, 1548, 1535, 7, 1
FROM [GDATA].[dbo].[tblFieldData] as gd
WHERE Parameter = 2
GROUP BY gd.G_ID
GO

/* Insert manual discharge measurements 

Need to fix possible duplicate values in the GData table BEFORE running this query
Since duplicates could be mislabelled values (wrong parameter, for instance), can't
just run a query to delete all the bad ones.

*/

/* Find duplicates */
-- SELECT MAX(fd.FieldData_ID), count(fd.FieldData_ID) as theCount
-- FROM [GDATA].[dbo].[tblFieldData] as fd
-- LEFT JOIN [GDATA].[dbo].tblFieldVisitInfo as fvi
-- ON fd.FieldVisit_ID = fvi.FieldVisit_ID
-- WHERE Date_Time IS NOT NULL
-- AND fd.Parameter = 2
-- GROUP BY fvi.Date_Time, fvi.UTC_Offset, fvi.G_ID
-- ORDER BY theCount DESC
-- GO

/* Insert values */
INSERT INTO Alqwu.dbo.Measurement 
WITH (TABLOCK)
  (MetadataID, CollectedDtm, CollectedDTMOffset, Value, Note)
SELECT amd.MetadataID, fvi.Date_Time, fvi.UTC_Offset*-60, fd.Parameter_Value, fvi.Comments
FROM [GDATA].[dbo].[tblFieldData] as fd
LEFT JOIN [GDATA].[dbo].tblFieldVisitInfo as fvi
ON fd.FieldVisit_ID = fvi.FieldVisit_ID
  LEFT JOIN Alqwu.dbo.Metadata as amd
    ON amd.SamplePointID = fd.G_ID
    AND amd.ParameterID = 1548
    AND amd.MethodID = 1535
WHERE Parameter = 2
AND Date_Time IS NOT NULL
AND MetadataID IS NOT NULL
AND Parameter_Value IS NOT NULL
GO

/* Insert conversions from GData ratings (stage-discharge relationships) */

/* Need to insert distinct ratings, but that's challenging, because 
  multiple ratings can have the same Rating_Number 
  
  Also need to add a unique index on conversion name in Sedna
  
  */
INSERT INTO [Alqwu].[dbo].[Conversion] 
  WITH (TABLOCK)
  (ConversionName, Active, Description)
SELECT DISTINCT Rating_Number, 1, Notes
FROM [GDATA].[dbo].[tblFlowRating_Stats]
GO

/* Insert conversion values from rating values */
INSERT INTO [Alqwu].[dbo].[ConversionValue]
  WITH (TABLOCK)
  ([ConversionID], [FromValue], [ToValue])
SELECT acf.ConversionID, WaterLevel + Offset, Discharge
  FROM [GDATA].[dbo].[tblFlowRatings] as gfr
  LEFT JOIN [GDATA].[dbo].[tblFlowRating_Stats] as gfrs
  ON gfr.RatingNumber = gfrs.Rating_Number
  LEFT JOIN Alqwu.dbo.Conversion as acf
  ON gfr.RatingNumber = acf.ConversionName
GO 

/* These options control the default selections during conversions */
INSERT INTO [Alqwu].[dbo].[DBOption] (Name, ValueInt)
VALUES ('Discharge_ParameterID', 1548), 
  ('Discharge_MethodID', 1499),
  ('CFS_UnitID', 7)
GO


