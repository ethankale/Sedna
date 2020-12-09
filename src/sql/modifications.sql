/* Changes from version 0.1.0 */

-- New index to prevent duplicate sample point names
CREATE UNIQUE NONCLUSTERED INDEX [samplepoint_unique_idx] ON [dbo].[SamplePoint]
(
	[SiteID] ASC,
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO