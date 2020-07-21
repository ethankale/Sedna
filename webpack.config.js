const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: {
    analysis_webpack: './src/renderer/js/analysis.js',
    data_webpack:     './src/renderer/js/data.js',
    metadata_webpack: './src/renderer/js/metadata.js',
    settings_webpack: './src/renderer/js/settings.js',
    index_webpack:    './src/renderer/js/index.js'
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  module: {
    rules: [
      {
        test: /\.vue$/i,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin()
  ]
};