
var sites       = [];
var params      = [];
var sitesMarkup = "";
var paramMarkup = "";

$(document).ready(function() {
    loadSites();
    $("#siteSelect").change(function() {loadParamList($("#siteSelect").val() )});
});


function loadSites() {
    $.ajax({url: "http://localhost:3000/api/v1/getSites"
    }).done(function(data) {
        sites = data;
        sites.forEach(site => sitesMarkup = sitesMarkup + '<option value="' + 
            site.SiteID + '">' + 
            site.Code + ': ' + site.Name + '</option>\n');
        $('#siteSelect').empty().append(sitesMarkup);
        $("#siteSelect").change();
    });
}

function loadParamList(siteid) {
    $.ajax({url: `http://localhost:3000/api/v1/getParamsBySite?siteid=${siteid}`
    }).done(function(data) {
        params = data;
        paramMarkup = "";
        params.forEach(param => paramMarkup = paramMarkup + `<button type="button" class="list-group-item list-group-item-action">${param.Name}</button>\n`);
        paramMarkup = '<div class="list-group list-group-flush">' + paramMarkup + "</div>";
        $('#paramList').empty().append(paramMarkup);
    });
}