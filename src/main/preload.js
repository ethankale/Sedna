const { writeFileSync, readFileSync, createWriteStream } = require('fs')
const PDFDocument     = require('pdfkit');
const SVGtoPDF        = require('svg-to-pdfkit');
const { dialog, app } = require('electron').remote;

const configFileName = 'alqwuconfig.json';

// Required to make testing work properly
if (process.env.NODE_ENV === 'test') {
  window.electronRequire = require;
}

window.writeText = function (text, filepath) {
  try {
      writeFileSync(filepath, text)
      window.writeFileStatus = "Success";
  } catch(err) {
      //console.log(err);
      window.writeFileStatus = "Fail";
  }
};

window.writeFileStatus = "Success";

window.openCSV = function() {
    let fo = dialog.showOpenDialogSync({
        title: 'Select CSV',
        properties: ['openFile']
    });
    
    if (typeof fo != 'undefined') {
      let path = fo[0];
      console.log(path);
      let data = readFileSync(path, "utf8").trim();
      return [path, data];
    } else {
      return ['',''];
    }
};

window.getConfig = function() {
  let configPath = app.getPath('userData') + '\\' + configFileName;
  try {
    let config = JSON.parse(readFileSync(configPath, "utf8"));
    return config;
  } catch(err) {
    //console.log(err);
    return {};
  }
};

window.setConfig = function(config) {
  let configPath = app.getPath('userData') + '\\' + configFileName;
  try {
    writeFileSync(configPath, JSON.stringify(config));
    return "Success";
  } catch(err) {
    console.log(err);
    return "Fail";
  }
};

// PDF Reports
window.makePDF = function(title, subtitle, table, column, svg, filename) {
  let defaultPath = window.getConfig().userDefaultPath + "/" + filename + ".pdf";
  // console.log(defaultPath);
  
  let path = dialog.showSaveDialogSync({
    title: "Save the report as",
    defaultPath: defaultPath
  });
  
  if (typeof path == 'undefined') {
    // console.log("User cancelled save.")
  } else {
    const doc = new PDFDocument();
    const writestream = createWriteStream(path);
    doc.pipe(writestream);
    
    writestream.on('error', function (err) {
      console.log(err);
    });
    
    // Title
    doc
      .font('Helvetica')
      .fontSize(16)
      .text(title, {align: 'center'})
    
    // Subtitle
    doc
      .fontSize(12)
      .text(subtitle, {align: 'center'})
      .moveDown();
    
    // Daily table
    doc
      .font('Courier')
      .fontSize(8);
      
    const titley = doc.y;
    let maxY = 0;
    
    let marginleft = 20;
    let colwidth   = 40;
    let lineheight = 12;
    let cellchars  = 10;
    
    let months = [
      "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
      "Apr", "May", "Jun", "Jul", "Aug", "Sep"
    ];
    months.forEach((m, i) => {
      let mstring = m.padStart(cellchars, " ");
      doc.text(mstring, ((i+1)*colwidth)+marginleft, titley, 
        {align: 'left', lineBreak: false});
    });
    
    let days   = [...Array(32).keys()];
    let monthArrays = {
      1:  [],
      2:  [],
      3:  [],
      4:  [],
      5:  [],
      6:  [],
      7:  [],
      8:  [],
      9:  [],
      10: [],
      11: [],
      12: []
    }
    
    days.forEach((d, i) => {
      let dstring = (d+":").padStart(10);
      if (i > 0) {
        doc.text(
          dstring, 
          marginleft, 
          (i*lineheight)+titley, 
          {
            align: 'left', 
            lineBreak: false
          }
        );
      };
    });
    
    // Format the data for the table
    table.forEach(row => {
      row.x = (row.month >= 10 ? (row.month-9) : (row.month+3)) * colwidth;
      row.y = row.day*lineheight;
      maxY  = maxY < row.y ? row.y : maxY;
      
      row.valString = '';
      if (row[column] !== null) {
        row.valString = row[column].toFixed(2).padStart(cellchars, " ");
        monthArrays[row.month].push(+row.valString);
      };
      
      doc.text(row.valString, row.x+marginleft, row.y+titley, 
        {align:'left', lineBreak: false});
    });
    
    // Write summary statistics
    let label = column == 'ValueSum' ? 'Sum:' : 'Mean:';
    doc.text(
      label.padStart(10), 
      marginleft, 
      (34*lineheight)+titley,
      {
        align:     'left',
        lineBreak: false
      }
    );
    
    let monthNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
    monthNumbers.forEach(m => {
      let monvals = monthArrays[m];
      let summaryVal = '';
      if (monvals.length > 0) {
        summaryVal = monvals.reduce((a,b) => a+b);
      };
      let row_x = (m >= 10 ? (m-9) : (m+3)) * colwidth;
      
      // If we're just reporting sums (rainfall), then we're done.  Otherwise, we want a mean.
      if (column == 'Value' && monvals.length > 0) {
        summaryVal = summaryVal / monvals.length;
      }
      
      summaryVal = summaryVal == '' ? '' : summaryVal.toFixed(2).padStart(cellchars, ' ');
      doc.text(
        summaryVal, 
        row_x+marginleft, 
        (34*lineheight)+titley,
        {
          align:     'left',
          lineBreak: false
        }
      );
      
    });
    
    // Graph
    SVGtoPDF(doc, svg, 56, 570, options = {
      width:  500,
      height: 200,
      preserveAspectRatio: 'xMidYMin meet',
      useCSS: true
    });
    
    console.log("next is doc.end()");
    
    writestream.on('finish', function () {
      console.log('done writing to file ' + path);
    });
    
    doc.end();
    // console.log(writestream);
    // console.log(doc);
    return "done";
  };
};


