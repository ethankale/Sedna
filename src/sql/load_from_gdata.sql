
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


