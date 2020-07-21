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

