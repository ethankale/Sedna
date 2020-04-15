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
