const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    monaco: './demo/monaco-demo.js',
    // Package each language's worker and give these filenames in `getWorkerUrl`
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './demo/dist/'),
    filename: '[name].bundle.js',
    publicPath: '/dist/'
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
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
  }
}
