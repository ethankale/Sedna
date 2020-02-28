SELECT sp.SiteID, md.ParameterID, max(ms.CollectedDtm) as maxdtm, min(ms.CollectedDtm) as mindtm
FROM dbo.Measurement as ms
INNER JOIN dbo.Metadata as md
ON ms.MetadataID = md.MetadataID
INNER JOIN dbo.SamplePoint as sp
ON md.SamplePointID = sp.SamplePointID
GROUP BY sp.SiteID, md.ParameterID;