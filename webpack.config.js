const path = require("path");

module.exports = {
 entry: {
    'excalibur-spritefusion': './src/index.ts',
    'excalibur-spritefusion.min': './src/index.ts',
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
 mode: 'development',
 devtool: 'source-map',
 devServer: {
   static: '.',
 },
 resolve: {
   fallback: {
      fs: false
   },
   extensions: [".ts", ".js"],
   alias: {
      "@": path.resolve(__dirname, './src/')
   }
 },
 output: {
   filename: "[name].js",
   path: path.join(__dirname, "dist"),
   library: ["ex", "Plugin", "SpriteFusion"],
   libraryTarget: "umd"
 },
 optimization: {
   minimize: true,
 },
 externals: {
    "excalibur": {
       commonjs: "excalibur",
       commonjs2: "excalibur",
       amd: "excalibur",
       root: "ex"
   }
 },
 plugins: [
   //  new BundleAnalyzerPlugin()
 ]
};