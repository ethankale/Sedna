USE [GDATA]
GO
/****** Object:  Table [dbo].[tblWQQualifier]    Script Date: 01/29/2021 11:22:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblWQQualifier](
	[code] [nchar](3) NOT NULL,
	[description] [varchar](255) NOT NULL,
 CONSTRAINT [PK_tblWQQualifier] PRIMARY KEY CLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'B  ', N'Analyte detected in sample and method blank. Reported result is sample concentration without blank correction or associated quantitation limit.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'B1 ', N'Analyte detected in sample and method blank. Reported result is blank-corrected.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'BAA', N'Bacteria Absent (not quantified)')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'BAP', N'Bacteria Present (not quantified)')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'E  ', N'Reported result is an estimate because it exceeds the calibration range.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'EQP', N'Inconsistent equipment performance (sensor, instrument, etc.); reported result meets study objectives.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'EST', N'Measurement value reported is estimated.  See comment for additional detail.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FA ', N'No site access')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FD ', N'Site was dry')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FE ', N'Equipment failure')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FH ', N'Flow too high to measure')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FI ', N'Ice impacted')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FL ', N'Above or below instrument or method limit')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FS ', N'Stagnant water â€“ no flow')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'FT ', N'Flow tidally impacted')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'G  ', N'Value is likely greater than the reported result. Reported result may be biased low.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'IA ', N'Instrument result adjusted; reported result meets study objectives')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'J  ', N'Analyte was positively identified. The reported result is an estimate.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JG ', N'Analyte was positively identified. Value may be greater than the reported estimate.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JK ', N'Analyte was positively identified. Reported result is an estimate with unknown bias.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JL ', N'Analyte was positively identified. Value may be less than the reported estimate.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JT ', N'Analyte was positively identified. Reported result is an estimate below the associated quantitation limit but above the MDL.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JTG', N'Analyte was positively identified. Value may be greater than the reported result, which is an estimate below the associated quantitation limit but above the MDL.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JTK', N'Analyte was positively identified. Reported result is an estimate with unknown bias, below the associated quantitation limit but above the MDL.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'JTL', N'Analyte was positively identified. Value may be less than the reported result which is an estimate below associated quantitation limit but above MDL.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'K  ', N'Reported result with unknown bias.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'L  ', N'Value is likely less than the reported result.  Reported result may be biased high.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'N  ', N'There is evidence the analyte is present in the sample. Tentatively identified analyte.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'NJ ', N'There is evidence that the analyte is present in the sample.  Reported result for the tentatively identified analyte is an estimate .')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'NJT', N'There is evidence the analyte is present in the sample. Reported result for the tentatively identified analyte is an estimate below the associated quantitation limit but above the MDL.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'NU ', N'There is evidence the analyte is present in the sample. Tentatively identified analyte was not detected at or above the reported result.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'NUJ', N'There is evidence the analyte is present in the sample. Tentatively identified analyte was not detected at or above the reported estimate.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'OOR', N'Out of range; dataset not in expected range for instrument type, data type, or historical climatology; reported result meets study objectives.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'OUT', N'Outlier within dataset; single result is unexpected or discontinuous.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'REJ', N'Data are unusable for all purposes. Sample results rejected due to serious deficiencies in the ability to analyze the sample and meet quality control criteria. The presence or absence of the analyte cannot be verified.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'T  ', N'Reported result below associated quantitation limit but above MDL')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'U  ', N'Analyte was not detected at or above the reported result.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'UJ ', N'Analyte was not detected at or above the reported estimate')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'UJG', N'Analyte was not detected at or above the reported estimate with likely low bias.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'UJK', N'Analyte was not detected at or above the reported estimate with unknown bias.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'UJL', N'Analyte was not detected at or above the reported estimate with likely high bias.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'VAR', N'Variation within dataset; multiple results creating an unexpected pattern.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLA', N'Well water level affected by atmospheric pressure.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLB', N'Well water level affected by tidal stage.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLC', N'Well water level affected by ice.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLD', N'Well was dry during measurement attempt.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLE', N'Well was flowing recently.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLF', N'Well was flowing and could not be measured.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLG', N'Nearby well(s) flowing during measurement.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLH', N'Nearby well(s) flowing recently.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLI', N'Well site was being injected during measurement.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLJ', N'Nearby well site(s) being injected during measurement.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLK', N'Water was cascading down inside of well.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLL', N'Well water level affected by brackish or saline water.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLM', N'Well was plugged and not in hydraulic contact with the aquifer.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLN', N'Well measurement discontinued.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLO', N'Well water level affected by/could not be measured due to obstruction in well.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLP', N'Well site was being pumped during measurement.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLR', N'Well site was pumped recently.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLS', N'Nearby well(s) being pumped during measurement.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLT', N'Nearby well(s) pumped recently.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLV', N'LNAPL (floating product) or other foreign substance on well water.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLW', N'Well was destroyed; water level could not be measured.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLX', N'Well water level affected by nearby surface-water stage.')
INSERT [dbo].[tblWQQualifier] ([code], [description]) VALUES (N'WLZ', N'Well water level affected by other conditions.')
