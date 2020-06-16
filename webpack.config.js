const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: 'development',
  entry: {
    analysis_webpack: './src/renderer/js/analysis.js',
    data_webpack:     './src/renderer/js/data.js',
    metadata_webpack: './src/renderer/js/metadata.js',
    settings_webpack: './src/renderer/js/settings.js'
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  
  plugins: [
    new VueLoaderPlugin()
  ]
};