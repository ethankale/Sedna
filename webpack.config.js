const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

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
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: 'style-loader'
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ];
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      }
    ]
  },
  
  plugins: [
    new VueLoaderPlugin()
  ]
};