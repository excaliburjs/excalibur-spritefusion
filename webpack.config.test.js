const path = require("path")
module.exports = {
   mode: 'development',
   devtool: 'source-map',
   devServer: {
      static: 'example/',
      compress: false,
      allowedHosts: 'all'
   },
   entry: {
      main: './example/main.ts',
   },
   output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'example'),
      libraryTarget: "umd"
   },
   module: {
      rules: [
         {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/
         }
      ]
   },
   resolve: {
      fallback: {
         fs: false
      },
      extensions: [".ts", ".js"],
      alias: {
         "@excalibur-spritefusion": path.resolve(__dirname, './src/')
      }
   }
};