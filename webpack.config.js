const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    monaco: './demo/monaco-demo.js'
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './demo/dist/'),
    filename: '[name].bundle.js',
    publicPath: '/dist/'
  },
  resolve: {
    alias: {
      'y-monaco': path.resolve(__dirname, 'src/y-monaco.js')
    }
  },
  devServer: {
    contentBase: path.join(__dirname, './demo'),
    compress: true,
    publicPath: '/dist/'
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.ttf$/,
      use: ['file-loader']
    }]
  },
  plugins: [
    new MonacoWebpackPlugin()
  ]
}
