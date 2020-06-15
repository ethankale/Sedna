const path = require('path');

module.exports = {
  entry: {
    analysis_webpack: './src/renderer/js/analysis.js',
    data_webpack:     './src/renderer/js/data.js',
    meta_webpack:     './src/renderer/js/metadata.js',
    settings_webpack: './src/renderer/js/settings.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};