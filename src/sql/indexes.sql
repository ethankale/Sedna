
USE [Alqwu]
GO

SET ARITHABORT ON
SET CONCAT_NULL_YIELDS_NULL ON
SET QUOTED_IDENTIFIER ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
SET NUMERIC_ROUNDABORT OFF
GO

/* Conversion constraints */
ALTER TABLE [dbo].[ConversionValue]  WITH NOCHECK ADD FOREIGN KEY([ConversionID])
REFERENCES [dbo].[Conversion] ([ConversionID])
GO

/* Equipment constraints */
ALTER TABLE [dbo].[Equipment]  WITH CHECK ADD  CONSTRAINT [Equipment_EquipmentModel_fk] FOREIGN KEY([EquipmentModelID])
REFERENCES [dbo].[EquipmentModel] ([EquipmentModelID])
GO
ALTER TABLE [dbo].[Equipment] CHECK CONSTRAINT [Equipment_EquipmentModel_fk]
GO

/* Measurement constraints */
ALTER TABLE [dbo].[Measurement] ADD CONSTRAINT [PK_Measurement] PRIMARY KEY CLUSTERED (MeasurementID)
GO
ALTER TABLE [dbo].[Measurement]  WITH NOCHECK ADD  CONSTRAINT [Measurement_Metadata_fk] FOREIGN KEY([MetadataID])
REFERENCES [dbo].[Metadata] ([MetadataID])
GO
ALTER TABLE [dbo].[Measurement] CHECK CONSTRAINT [Measurement_Metadata_fk]
GO
ALTER TABLE [dbo].[Measurement]  WITH NOCHECK ADD  CONSTRAINT [Measurement_Qualifier_fk] FOREIGN KEY([QualifierID])
REFERENCES [dbo].[Qualifier] ([QualifierID])
GO
ALTER TABLE [dbo].[Measurement] CHECK CONSTRAINT [Measurement_Qualifier_fk]
GO

/* Metadata constraints */
ALTER TABLE [dbo].[Metadata]  WITH CHECK ADD  CONSTRAINT [Metadata_Method_fk] FOREIGN KEY([MethodID])
REFERENCES [dbo].[Method] ([MethodID])
GO
ALTER TABLE [dbo].[Metadata] CHECK CONSTRAINT [Metadata_Method_fk]
GO
ALTER TABLE [dbo].[Metadata]  WITH CHECK ADD  CONSTRAINT [Metadata_SamplePoint_fk] FOREIGN KEY([SamplePointID])
REFERENCES [dbo].[SamplePoint] ([SamplePointID])
GO
ALTER TABLE [dbo].[Metadata] CHECK CONSTRAINT [Metadata_SamplePoint_fk]
GO
ALTER TABLE [dbo].[Metadata]  WITH CHECK ADD  CONSTRAINT [Parameter_Classifies_Metadata] FOREIGN KEY([ParameterID])
REFERENCES [dbo].[Parameter] ([ParameterID])
GO
ALTER TABLE [dbo].[Metadata] CHECK CONSTRAINT [Parameter_Classifies_Metadata]
GO
ALTER TABLE [dbo].[Metadata]  WITH CHECK ADD  CONSTRAINT [Unit_Describes_Metadata_fk] FOREIGN KEY([UnitID])
REFERENCES [dbo].[Unit] ([UnitID])
GO
ALTER TABLE [dbo].[Metadata] CHECK CONSTRAINT [Unit_Describes_Metadata_fk]
GO

/* Sample Point constraints */
ALTER TABLE [dbo].[SamplePoint]  WITH CHECK ADD  CONSTRAINT [SamplePoint_Site_fk] FOREIGN KEY([SiteID])
REFERENCES [dbo].[Site] ([SiteID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[SamplePoint] CHECK CONSTRAINT [SamplePoint_Site_fk]
GO


/****** Object:  Index [ConversionValue_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [ConversionValue_idx] ON [dbo].[ConversionValue]
(
	[ConversionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/****** Object:  Index [measurement_addeddate_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [measurement_addeddate_idx] ON [dbo].[Measurement]
(
	[AddedDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/****** Object:  Index [measurement_collecteddate_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [measurement_collecteddate_idx] ON [dbo].[Measurement]
(
	[MetadataID] ASC,
	[CollectedDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/****** Object:  Index [measurement_collecteddtm_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [measurement_collecteddtm_idx] ON [dbo].[Measurement]
(
	[CollectedDTM] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO


/****** Object:  Index [measurement_metadataid_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [measurement_metadataid_idx] ON [dbo].[Measurement]
(
	[MetadataID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/* This query deletes any duplicate measurements that were imported from GData.
	It arbitrarily deletes rows according to their MeasurementID (highest ID is preserved) */
DELETE
FROM [Alqwu].[dbo].[Measurement]
WHERE MeasurementID NOT IN (
  SELECT MAX(MeasurementID)
  FROM [Alqwu].[dbo].[Measurement] as m
  GROUP BY m.MetadataID, m.CollectedDateTime, m.Depth_M, m.Duplicate
);

/****** Object:  Index [measurement_unique_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [measurement_unique_idx] ON [dbo].[Measurement]
(
	[MetadataID] ASC,
	[CollectedDateTime] ASC,
	[Depth_M] ASC,
  [Duplicate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/* Foreign key between GraphType and Method and GraphType and Metadata.*/
ALTER TABLE Alqwu.dbo.[Method]  
WITH CHECK ADD CONSTRAINT Measurement_Default_GraphType_fk FOREIGN KEY(GraphTypeID)
REFERENCES Alqwu.dbo.GraphType (GraphTypeID)
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE Alqwu.dbo.[Method] CHECK CONSTRAINT [Measurement_Default_GraphType_fk]
GO

ALTER TABLE Alqwu.dbo.[Metadata]  
WITH CHECK ADD CONSTRAINT Metadata_GraphType_fk FOREIGN KEY(GraphTypeID)
REFERENCES Alqwu.dbo.GraphType (GraphTypeID)
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE Alqwu.dbo.[Metadata] CHECK CONSTRAINT [Metadata_GraphType_fk]
GO

/* Enforce unique names for conversions */
CREATE UNIQUE NONCLUSTERED INDEX [conversion_unique_idx] ON [dbo].[Conversion]
(
	[ConversionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE Alqwu.dbo.[Metadata]
WITH CHECK ADD CONSTRAINT Metadata_Sensor_Equipment_fk FOREIGN KEY(EquipmentIDSensor)
References Alqwu.dbo.Equipment (EquipmentID)
ON UPDATE NO ACTION
ON DELETE NO ACTION
GO
ALTER TABLE Alqwu.dbo.[Metadata] CHECK CONSTRAINT [Metadata_Sensor_Equipment_fk]
GO

ALTER TABLE Alqwu.dbo.[Metadata]
WITH CHECK ADD CONSTRAINT Metadata_Logger_Equipment_fk FOREIGN KEY(EquipmentIDLogger)
References Alqwu.dbo.Equipment (EquipmentID)
ON UPDATE NO ACTION
ON DELETE NO ACTION
GO
ALTER TABLE Alqwu.dbo.[Metadata] CHECK CONSTRAINT [Metadata_Logger_Equipment_fk]
GO


CREATE UNIQUE NONCLUSTERED INDEX [samplepoint_unique_idx] ON [dbo].[SamplePoint]
(
	[SiteID] ASC,
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO