ALTER TABLE Metadata 
ADD DecimalPoints tinyint DEFAULT 2;
GO

CREATE UNIQUE INDEX measurement_unique_idx
ON Measurement (CollectedDtm, MetadataID);
GO

ALTER TABLE Site
ADD Active bit DEFAULT 1;
GO
UPDATE Site
SET Active = 1;
GO
ALTER TABLE Site
ALTER COLUMN Active bit NOT NULL;
GO

ALTER TABLE SamplePoint
ADD LatLongAccuracyFeet smallint NULL,
LatLongDate datetime2(0) NULL,
LatLongDetails varchar(255) NULL,
ElevationAccuracyFeet smallint NULL,
ElevationDate datetime2(0) NULL,
ElevationDetails varchar(255) NULL,
WellType varchar(100) NULL,
WellCompletionType varchar(100) NULL,
WellIntervalTopFeet numeric(6,2) NULL,
WellIntervalBottomFeet numeric(6,2) NULL,
WellInnerDiameterInches numeric(4,2) NULL,
WellOuterDiameterInches numeric(4,2) NULL,
WellStickupFeet numeric(4,2) NULL,
WellStickupDate datetime2(0) NULL,
WellDrilledBy varchar(100) NULL,
WellEcologyTagID varchar(10) NULL,
WellEcologyStartCardID varchar(15),
AddedOn datetime2(0) NULL,
RemovedOn datetime2(0) NULL,
Active bit DEFAULT 1 NOT NULL
GO

ALTER TABLE SamplePoint
DROP CONSTRAINT SamplePoint_Site_fk;
GO

ALTER TABLE SamplePoint
ADD CONSTRAINT SamplePoint_Site_fk FOREIGN KEY (SiteID)
REFERENCES Site (SiteID)
ON DELETE CASCADE
ON UPDATE CASCADE;
GO

ALTER TABLE EquipmentModel
ADD Active bit DEFAULT 1;
GO
UPDATE EquipmentModel
SET Active = 1;
GO
ALTER TABLE EquipmentModel
ALTER COLUMN Active bit NOT NULL;
GO

ALTER TABLE Equipment
ADD Active bit DEFAULT 1;
GO
UPDATE Equipment
SET Active = 1;
GO
ALTER TABLE Equipment
ALTER COLUMN Active bit NOT NULL;
GO

ALTER TABLE [User]
ADD Active bit DEFAULT 1;
GO
UPDATE [User]
SET Active = 1;
GO
ALTER TABLE [User]
ALTER COLUMN Active bit NOT NULL;
GO

ALTER TABLE Measurement
ADD CollectedDateTime datetimeoffset(0) NULL;
GO
UPDATE Measurement
SET CollectedDateTime = todatetimeoffset(CollectedDtm,-8*60)
GO
ALTER TABLE Measurement
ALTER COLUMN CollectedDateTime DateTimeOffset(0) NOT NULL;
GO
DROP INDEX Measurement.measurement_unique_idx;
GO
CREATE UNIQUE INDEX measurement_unique_idx
ON Measurement (CollectedDateTime, MetadataID)
GO
DROP INDEX Measurement.measurement_metadataid_idx;
GO
CREATE INDEX measurement_metadataid_idx
ON Measurement (MetadataID)
GO
ALTER VIEW Measurement_By_SamplePoint_v
AS
SELECT sp.SiteID, md.ParameterID, md.MethodID, pm.Name, 
    mt.Description AS Method, MAX(ms.CollectedDateTime) AS maxdtm, 
    MIN(ms.CollectedDateTime) AS mindtm, COUNT(ms.MeasurementID) AS nmeasure
FROM dbo.Measurement AS ms 
  INNER JOIN dbo.Metadata AS md ON ms.MetadataID = md.MetadataID 
  INNER JOIN dbo.SamplePoint AS sp ON md.SamplePointID = sp.SamplePointID 
  INNER JOIN dbo.Parameter AS pm ON pm.ParameterID = md.ParameterID 
  INNER JOIN dbo.Method AS mt ON md.MethodID = mt.MethodID
GROUP BY sp.SiteID, md.ParameterID, md.MethodID, pm.Name, mt.Description;
GO
ALTER TABLE Measurement
DROP COLUMN CollectedDtm;
GO
ALTER TABLE Measurement
ADD CollectedDate AS (CONVERT(date,CollectedDateTime)) PERSISTED;
GO
CREATE INDEX measurement_collecteddate_idx
ON Measurement (CollectedDate)
GO
ALTER TABLE Measurement
ADD AddedDate datetime2(0) DEFAULT(GETDATE())
GO
CREATE INDEX measurement_addeddate_idx
ON Measurement (AddedDate)
GO
ALTER TABLE Measurement
ADD Depth_M Numeric(6,2) NULL
GO
DROP INDEX Measurement.measurement_unique_idx;
GO
CREATE UNIQUE INDEX measurement_unique_idx
ON Measurement (CollectedDateTime, MetadataID, Depth_M)
GO


CREATE TABLE Conversion (
  ConversionID INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
  ConversionName VARCHAR(100) NOT NULL,
  CreatedBy VARCHAR(100) NULL,
  LastModified Date NULL,
  Active BIT DEFAULT 1 NOT NULL,
  Description VARCHAR(255)
);
GO
CREATE TABLE ConversionValue (
  ConversionValueID INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
  ConversionID INT NOT NULL REFERENCES Conversion(ConversionID),
  FromValue Numeric(18,6) NOT NULL,
  ToValue Numeric(18,6) NOT NULL
);
GO

