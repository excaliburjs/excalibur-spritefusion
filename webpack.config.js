const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');


/**
 * @returns {import('webpack').Configuration}
 */
module.exports = (env, argv) => {
  const { mode } = argv;

  const umdOutput = {
    path: path.resolve(__dirname, 'build/umd'),
    filename: mode === 'development' ? '[name].development.js' : '[name].js',
    library: {
      name: ["ex", "Plugin", "SpriteFusion"],
      type: 'umd'
    }
  };

  const esmOutput = {
    path: path.resolve(__dirname, 'build/esm'),
    filename: mode === 'development' ? '[name].development.js' : '[name].js',
    module: true,
    library: {
      type: 'module'
    }
  };

  return {
    resolve: {
      alias: {
        "excalibur": path.resolve('./node_modules/excalibur')
      }
    },
    entry: {
      'excalibur-spritefusion': './src/index.ts',
      'excalibur-spritefusion.min': './src/index.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              outDir: env.output === 'esm' ? esmOutput.path : umdOutput.path
            }
          }
        },
      ]
    },
    mode,
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
    output: env.output === 'esm' ? esmOutput : umdOutput,
    experiments: env.output === 'esm' ? { outputModule: true } : {},
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          include: /\.min\.js$/
        })
      ]
    },
    externals: ["excalibur"],
    plugins: [
      //  new BundleAnalyzerPlugin()
    ]
  };
};