ALTER TABLE Metadata 
ADD DecimalPoints tinyint DEFAULT 2;

CREATE UNIQUE INDEX measurement_unique_idx
ON Measurement (CollectedDtm, MetadataID);

ALTER TABLE Site
ADD Active bit DEFAULT 1;

UPDATE Site
SET Active = 1

ALTER TABLE Site
ALTER COLUMN Active bit NOT NULL