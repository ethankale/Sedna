
var sites = [];
var sitesMarkup = "";

$(document).ready(function() {
    loadSites();
});


function loadSites() {
    $.ajax({url: "http://localhost:3000/api/v1/getSites"
    }).done(function(data) {
        sites = data;
        sites.forEach(site => sitesMarkup = sitesMarkup + '<option value="' + 
            site.SiteID + '">' + 
            site.Code + ': ' + site.Name + '</option>\n');
        $('#siteSelect').empty().append(sitesMarkup);
    });
}