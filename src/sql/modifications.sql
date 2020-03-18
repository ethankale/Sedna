ALTER TABLE Metadata ADD DecimalPoints tinyint DEFAULT 2;

CREATE UNIQUE INDEX measurement_unique_idx
ON Measurement (CollectedDtm, MetadataID);