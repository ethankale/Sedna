USE [master]
GO
/****** Object:  Database [Alqwu]    Script Date: 2020-06-10 2:18:40 PM ******/
CREATE DATABASE [Alqwu]
GO
ALTER DATABASE [Alqwu] SET COMPATIBILITY_LEVEL = 110
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [Alqwu].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [Alqwu] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [Alqwu] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [Alqwu] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [Alqwu] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [Alqwu] SET ARITHABORT OFF 
GO
ALTER DATABASE [Alqwu] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [Alqwu] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [Alqwu] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [Alqwu] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [Alqwu] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [Alqwu] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [Alqwu] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [Alqwu] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [Alqwu] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [Alqwu] SET  DISABLE_BROKER 
GO
ALTER DATABASE [Alqwu] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [Alqwu] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [Alqwu] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [Alqwu] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [Alqwu] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [Alqwu] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [Alqwu] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [Alqwu] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [Alqwu] SET  MULTI_USER 
GO
ALTER DATABASE [Alqwu] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [Alqwu] SET DB_CHAINING OFF 
GO
ALTER DATABASE [Alqwu] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [Alqwu] SET TARGET_RECOVERY_TIME = 0 SECONDS 
GO
EXEC sys.sp_db_vardecimal_storage_format N'Alqwu', N'ON'
GO
USE [Alqwu]
GO

/****** Object:  Table [dbo].[DBOption]  ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DBOption](
  [DBOptionID] [int] IDENTITY(1,1) NOT NULL,
  [Name] VARCHAR(255) NOT NULL,
  [ValueInt] [int] NULL,
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[Measurement]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Measurement](
    [MeasurementID] [int] IDENTITY(1,1) NOT NULL,
    [Value] [numeric](18, 6) NULL,
    [MetadataID] [int] NOT NULL,
    [QualifierID] [int] NULL,
    [AddedDate] [datetime2](0) NULL,
    [CollectedDTM] [datetime2](0) NOT NULL,
    [CollectedDTMOffset] [int] NOT NULL,
    [CollectedDateTime]  AS (todatetimeoffset([CollectedDTM],[CollectedDTMOffset])) PERSISTED,
    [CollectedDate]  AS (CONVERT([date],todatetimeoffset([CollectedDTM],[CollectedDTMOffset]))) PERSISTED,
    [Depth_M] [numeric](6, 2) NULL,
    [Duplicate] BIT NULL,
    [LabBatch] VARCHAR(255) NULL,
    [Symbol] CHAR(1) NULL,
    [Provisional] BIT NULL,
    [Note] VARCHAR(255) NULL,
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SamplePoint]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SamplePoint](
    [SamplePointID] [int] IDENTITY(1,1) NOT NULL,
    [SiteID] [int] NOT NULL,
    [Name] [varchar](100) NOT NULL,
    [Description] [varchar](255) NULL,
    [Latitude] [numeric](9, 6) NULL,
    [Longitude] [numeric](9, 6) NULL,
    [ElevationFeet] [numeric](8, 2) NULL,
    [ElevationDatum] [nchar](10) NULL,
    [ElevationReference] [varchar](255) NULL,
    [LatLongAccuracyFeet] [smallint] NULL,
    [LatLongDate] [datetime2](0) NULL,
    [LatLongDetails] [varchar](255) NULL,
    [ElevationAccuracyFeet] [smallint] NULL,
    [ElevationDate] [datetime2](0) NULL,
    [ElevationDetails] [varchar](255) NULL,
    [WellType] [varchar](100) NULL,
    [WellCompletionType] [varchar](100) NULL,
    [WellIntervalTopFeet] [numeric](6, 2) NULL,
    [WellIntervalBottomFeet] [numeric](6, 2) NULL,
    [WellInnerDiameterInches] [numeric](4, 2) NULL,
    [WellOuterDiameterInches] [numeric](4, 2) NULL,
    [WellStickupFeet] [numeric](4, 2) NULL,
    [WellStickupDate] [datetime2](0) NULL,
    [WellDrilledBy] [varchar](100) NULL,
    [WellEcologyTagID] [varchar](10) NULL,
    [WellEcologyStartCardID] [varchar](15) NULL,
    [AddedOn] [datetime2](0) NULL,
    [RemovedOn] [datetime2](0) NULL,
    [Active] [bit] NOT NULL,
 CONSTRAINT [PK_SamplePoint] PRIMARY KEY CLUSTERED 
(
    [SamplePointID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Parameter]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Parameter](
    [ParameterID] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](125) NULL,
    [CAS] [varchar](12) NULL,
    [Description] [varchar](255) NULL,
 CONSTRAINT [PK_Parameter] PRIMARY KEY CLUSTERED 
(
    [ParameterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Metadata]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Metadata](
    [MetadataID] [int] IDENTITY(1,1) NOT NULL,
    [ParameterID] [int] NOT NULL,
    [UnitID] [int] NOT NULL,
    [SamplePointID] [int] NOT NULL,
    [MethodID] [int] NOT NULL,
    [Active] [bit] NOT NULL,
    [FrequencyMinutes] [int] NULL,
    [DecimalPoints] [tinyint] NULL,
    [GraphTypeID] [int] NULL,
    [FileName] [varchar](255) NULL,
    [DataStarts] [datetime2](0) NULL,
    [DataEnds] [datetime2](0) NULL,
    [UserID] [int] NULL,
    [EquipmentIDSensor] [int] NULL,
    [EquipmentIDLogger] [int] NULL,
    [CorrectionOffset] [numeric](18, 6) NULL,
    [CorrectionDrift] [numeric](18, 6) NULL,
    [CorrectionStepChange] [numeric](18, 6) NULL,
    [Notes] [varchar](255) NULL,
    [CreatedOn] [datetime2](0) DEFAULT(getdate()),
 CONSTRAINT [PK_Metadata] PRIMARY KEY CLUSTERED 
(
    [MetadataID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Method]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Method](
    [MethodID] [int] IDENTITY(1,1) NOT NULL,
    [Code] [varchar](25) NOT NULL,
    [Description] [varchar](255) NULL,
    [Reference] [varchar](255) NULL,
 CONSTRAINT [PK_Method] PRIMARY KEY CLUSTERED 
(
    [MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[Measurement_By_SamplePoint_v]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[Measurement_By_SamplePoint_v]
AS
SELECT        sp.SiteID, md.ParameterID, md.MethodID, pm.Name, mt.Description AS Method, MAX(ms.CollectedDateTime) AS maxdtm, MIN(ms.CollectedDateTime) AS mindtm, COUNT(ms.MeasurementID) AS nmeasure
FROM            dbo.Measurement AS ms INNER JOIN
                         dbo.Metadata AS md ON ms.MetadataID = md.MetadataID INNER JOIN
                         dbo.SamplePoint AS sp ON md.SamplePointID = sp.SamplePointID INNER JOIN
                         dbo.Parameter AS pm ON pm.ParameterID = md.ParameterID INNER JOIN
                         dbo.Method AS mt ON md.MethodID = mt.MethodID
GROUP BY sp.SiteID, md.ParameterID, md.MethodID, pm.Name, mt.Description
GO
/****** Object:  Table [dbo].[Conversion]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Conversion](
    [ConversionID] [int] IDENTITY(1,1) NOT NULL,
    [ConversionName] [varchar](100) NOT NULL,
    [CreatedBy] [varchar](100) NULL,
    [LastModified] [date] NULL,
    [Active] [bit] NOT NULL,
    [Description] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
    [ConversionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ConversionValue]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ConversionValue](
    [ConversionValueID] [int] IDENTITY(1,1) NOT NULL,
    [ConversionID] [int] NOT NULL,
    [FromValue] [numeric](18, 6) NOT NULL,
    [ToValue] [numeric](18, 6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
    [ConversionValueID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Equipment]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Equipment](
    [EquipmentID] [int] IDENTITY(1,1) NOT NULL,
    [EquipmentModelID] [int] NOT NULL,
    [SerialNumber] [varchar](100) NULL,
    [LastCalibrationDate] [date] NULL,
    [Notes] [varchar](255) NULL,
    [Active] [bit] NOT NULL,
 CONSTRAINT [PK_Equipment] PRIMARY KEY CLUSTERED 
(
    [EquipmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EquipmentModel]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EquipmentModel](
    [EquipmentModelID] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](100) NOT NULL,
    [Manufacturer] [varchar](100) NULL,
    [Description] [varchar](255) NULL,
    [Active] [bit] NOT NULL,
 CONSTRAINT [PK_EquipmentModel] PRIMARY KEY CLUSTERED 
(
    [EquipmentModelID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Qualifier]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Qualifier](
    [QualifierID] [int] IDENTITY(1,1) NOT NULL,
    [Code] [nchar](3) NOT NULL,
    [Description] [varchar](255) NOT NULL,
 CONSTRAINT [PK_Qualifier] PRIMARY KEY CLUSTERED 
(
    [QualifierID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [Qualifier_Code_Unique_ix] UNIQUE NONCLUSTERED 
(
    [Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Site]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Site](
    [SiteID] [int] IDENTITY(1,1) NOT NULL,
    [Code] [varchar](50) NULL,
    [Name] [varchar](100) NULL,
    [Description] [varchar](8000) NULL,
    [Address] [varchar](255) NULL,
    [City] [varchar](255) NULL,
    [ZipCode] [varchar](10) NULL,
    [Active] [bit] NOT NULL,
 CONSTRAINT [PK_Site] PRIMARY KEY CLUSTERED 
(
    [SiteID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [Site_Code_Unique_ix] UNIQUE NONCLUSTERED 
(
    [Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Unit]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Unit](
    [UnitID] [int] IDENTITY(1,1) NOT NULL,
    [Symbol] [varchar](10) NOT NULL,
    [Description] [varchar](255) NULL,
 CONSTRAINT [PK_Unit] PRIMARY KEY CLUSTERED 
(
    [UnitID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 2020-06-10 2:18:40 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
    [UserID] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](100) NULL,
    [Email] [varchar](255) NULL,
    [Phone] [varchar](18) NULL,
    [Active] [bit] NOT NULL,
 CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED 
(
    [UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/* Create a graph table */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GraphType](
    [GraphTypeID] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](100) NULL,
    [Description] [varchar](255) NULL,
 CONSTRAINT [PK_GraphType] PRIMARY KEY CLUSTERED ([GraphTypeID] ASC)
 WITH (
    PAD_INDEX = OFF, 
    STATISTICS_NORECOMPUTE = OFF, 
    IGNORE_DUP_KEY = OFF, 
    ALLOW_ROW_LOCKS = ON, 
    ALLOW_PAGE_LOCKS = ON)
 ON [PRIMARY]
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

/* Add new graph column to method table, and create the foreign key */
ALTER TABLE Alqwu.dbo.[Method]
ADD GraphTypeID INT NULL
CONSTRAINT GraphTypeIDDefault
DEFAULT 1 WITH VALUES;

SET ARITHABORT ON
SET CONCAT_NULL_YIELDS_NULL ON
SET QUOTED_IDENTIFIER ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
SET NUMERIC_ROUNDABORT OFF
GO
ALTER TABLE [dbo].[Conversion] ADD  DEFAULT ((1)) FOR [Active]
GO
ALTER TABLE [dbo].[Equipment] ADD  DEFAULT ((1)) FOR [Active]
GO
ALTER TABLE [dbo].[EquipmentModel] ADD  DEFAULT ((1)) FOR [Active]
GO
ALTER TABLE [dbo].[Measurement] ADD  DEFAULT (getdate()) FOR [AddedDate]
GO
ALTER TABLE [dbo].[Metadata] ADD  CONSTRAINT [DF_Metadata_Active]  DEFAULT ((0)) FOR [Active]
GO
ALTER TABLE [dbo].[Metadata] ADD  DEFAULT ((2)) FOR [DecimalPoints]
GO
ALTER TABLE [dbo].[SamplePoint] ADD  DEFAULT ((1)) FOR [Active]
GO
ALTER TABLE [dbo].[Site] ADD  DEFAULT ((1)) FOR [Active]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ((1)) FOR [Active]
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "ms"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 281
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "md"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 224
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "sp"
            Begin Extent = 
               Top = 138
               Left = 262
               Bottom = 268
               Right = 467
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pm"
            Begin Extent = 
               Top = 6
               Left = 319
               Bottom = 136
               Right = 505
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "mt"
            Begin Extent = 
               Top = 6
               Left = 543
               Bottom = 136
               Right = 729
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 12
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Measurement_By_SamplePoint_v'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane2', @value=N'' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Measurement_By_SamplePoint_v'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=2 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'Measurement_By_SamplePoint_v'
GO
USE [master]
GO
ALTER DATABASE [Alqwu] SET  READ_WRITE 
GO
