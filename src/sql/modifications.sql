/* Create a graph table */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GraphType](
	[GraphTypeID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](100) NULL,
	[Description] [varchar](255) NULL,
 CONSTRAINT [PK_GraphType] PRIMARY KEY CLUSTERED 
(
	[GraphTypeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

INSERT INTO Alqwu.dbo.GraphType (Name, Description)
VALUES ('Line with Range', 'A single line representing values, with a polygon representing a range of values.')
GO

INSERT INTO Alqwu.dbo.GraphType (Name, Description)
VALUES ('Bar Sum', 'A bar graph that represents the sum of values for a time period; useful for e.g. rainfall.')
GO

INSERT INTO Alqwu.dbo.GraphType (Name, Description)
VALUES ('Point', 'A simple scatterplot with one dot representing each data point.')
GO

INSERT INTO Alqwu.dbo.GraphType (Name, Description)
VALUES ('Polar', 'A scatterplot on polar coordinates, where the minimum extent is next to the maximum.')
GO


/* Add new graph column to parameter table, and create the foreign key */
ALTER TABLE Alqwu.dbo.[Parameter]
ADD GraphTypeID INT NULL
CONSTRAINT GraphTypeIDDefault
DEFAULT 1 WITH VALUES;

ALTER TABLE Alqwu.dbo.[Parameter]  
WITH CHECK ADD CONSTRAINT Measurement_Default_GraphType_fk FOREIGN KEY(GraphTypeID)
REFERENCES Alqwu.dbo.GraphType (GraphTypeID)
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE Alqwu.dbo.[Parameter] CHECK CONSTRAINT [Measurement_Default_GraphType_fk]
GO

/* Add some new fields specifically for water quality/lab data */
ALTER TABLE Alqwu.dbo.[Measurement]
ADD Duplicate BIT NULL
DEFAULT 0
GO

ALTER TABLE Alqwu.dbo.[Measurement]
ADD LabBatch VARCHAR(255) NULL
GO

ALTER TABLE Alqwu.dbo.[Measurement]
ADD Symbol CHAR(1) NULL
DEFAULT '='
GO

ALTER TABLE Alqwu.dbo.[Measurement]
ADD Provisional BIT NULL
DEFAULT 0
GO

/* Modify the indexes to support flagged duplicate values */
DROP INDEX [measurement_unique_idx]
  ON Alqwu.dbo.[Measurement]
GO


CREATE UNIQUE NONCLUSTERED INDEX [measurement_unique_idx] ON [dbo].[Measurement]
(
	[MetadataID] ASC,
	[CollectedDateTime] ASC,
	[Depth_M] ASC,
  [Duplicate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE Alqwu.dbo.[Workup]
ADD Notes varchar(255) NULL
GO

ALTER TABLE Alqwu.dbo.[Measurement]
DROP COLUMN MeasurementCommentID
GO

ALTER TABLE Alqwu.dbo.[Measurement]
DROP COLUMN MeasurementQualityID
GO

ALTER TABLE Alqwu.dbo.[Measurement]
ADD Note varchar(255) NULL
GO

/* Changed my mind; the default graph should be tied to method, not parameter */
ALTER TABLE Alqwu.dbo.Parameter  
DROP CONSTRAINT GraphTypeIDDefault;  
GO 

ALTER TABLE Alqwu.dbo.Parameter
DROP CONSTRAINT Measurement_Default_GraphType_fk;
GO

ALTER TABLE Alqwu.dbo.Parameter  
DROP COLUMN GraphTypeID;  
GO 

ALTER TABLE Alqwu.dbo.[Method]
ADD GraphTypeID INT NULL
CONSTRAINT GraphTypeIDDefault
DEFAULT 1 WITH VALUES;
GO 

ALTER TABLE Alqwu.dbo.Metadata
ADD GraphTypeID INT NULL
GO

ALTER TABLE Alqwu.dbo.Metadata
ADD FileName VARCHAR(255) NULL,
  DataStarts datetime2(0) NULL,
  DataEnds datetime2(0) NULL,
  LoadedOn date NULL,
  UserID int NULL
GO


    [FileName] [varchar](255) NULL,
    [DataStarts] [datetime2](0) NULL,
    [DataEnds] [datetime2](0) NULL,
    [LoadedOn] [date] NULL,
    [UserID] [int] NULL,







