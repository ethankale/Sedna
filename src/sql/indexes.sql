
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

/****** Object:  Index [measurement_unique_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [measurement_unique_idx] ON [dbo].[Measurement]
(
	[MetadataID] ASC,
	[CollectedDateTime] ASC,
	[Depth_M] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

/****** Object:  Index [WorkupLoadedBy_idx]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE NONCLUSTERED INDEX [WorkupLoadedBy_idx] ON [dbo].[Workup]
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO