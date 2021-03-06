USE [GDATA]
GO
/****** Object:  Table [dbo].[tblWQUnit]    Script Date: 01/29/2021 11:22:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblWQUnit](
	[symbol] [nchar](10) NOT NULL,
	[description] [varchar](255) NULL,
 CONSTRAINT [PK_tblWQUnit_1] PRIMARY KEY CLUSTERED 
(
	[symbol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'#/100mL   ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'#cfu/100ml', N'Number of Colony Forming Units (cfu) per 100 ml')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'%         ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'Abs/Pres  ', N'Bacteria absence = 0; bacteria presence = 1')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'atm       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'C         ', N'Temperature, Degrees C')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'cfs       ', N'Cubic Feet per Second')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'cm        ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'cms       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ColorUnits', N'Total Inorganic Color')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'FNU       ', N'Formazin Nephelometric Unit (FNU)')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ft        ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'g/Kg      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'in        ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'in/Hg     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'L/s       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'm         ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mg CaCO3/L', N'Milligrams calcium carbonate per liter; specific to hardness measurements')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mg/g      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mg/Kg     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mg/L      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mg/m3     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mgd       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mm        ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'mm/Hg     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'MPN/100g  ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'MPN/g     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ng/g      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ng/Kg     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ng/L      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'NTU       ', N'Nephelometric Turbidity Unit (NTU)')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'NTU or FNU', N'Check logs for Nephelometric Turbidity Unit (NTU) or Formazin Nephelometric Unit (FNU)')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'pg/g      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'pg/L      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ppb       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ppm       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ppq       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ppt       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'pptr      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'PSS       ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'Std. Units', N'pH Standard Units')
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ug/g      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ug/Kg     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ug/L      ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'ug/m3     ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'umhos/cm  ', NULL)
INSERT [dbo].[tblWQUnit] ([symbol], [description]) VALUES (N'uS/cm     ', N'Microsiemens per centimeter')
