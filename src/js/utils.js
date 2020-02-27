
exports.calcWaterYear = function(dt) {
    var year = dt.getFullYear()
    var mon  = dt.getMonth()
    
    // Zero-indexed months; 8 = September
    return(mon > 8 ? year+1 : year)
}

var utcoffset = -8;

exports.utcoffset   = utcoffset;             // Difference between local and UTC
exports.utcoffsetjs = utcoffset*60*60*1000;  // UTC offset in milliseconds
