// const path = require("path");
// const webpack = require("webpack");
// const pkg = require("./package.json");

// const pkgName = "index";

// module.exports = (env, args) => ({
//   target: "web",
//   mode: "production",
//   resolve: { extensions: [".ts", ".js", ".json"] },
//   devtool: "source-map",
//   module: {
//     rules: [
//       {
//         test: /\.ts?$/,
//         loader: "ts-loader",
//         options: {
//           transpileOnly: true,
//         },
//       }, //include: path.join(__dirname, 'externals/vscode/src')
//       // {
//       //   test: /\.css$/i,
//       //   use: ["style-loader", "css-loader"],
//       // },
//       // {
//       //   test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
//       //   use: [
//       //     {
//       //       loader: "file-loader",
//       //       options: {
//       //         name: "[name].[ext]",
//       //         outputPath: "fonts/",
//       //       },
//       //     },
//       //   ],
//       // },
//     ],
//   },
//   resolve: {
//     modules: ["node_modules"],
//     // alias: {
//     //   ["vs"]: path.resolve(__dirname, "externals/vscode/src/vs"),
//     //   // ["@root"]: path.resolve(__dirname, "src"),
//     // },
//     // plugins: [
//     //   new TsconfigPathsPlugin({
//     //     /* options: see below */
//     //   }),
//     // ],
//   },
//   entry: "./src/index.ts",
//   output: {
//     filename: `${pkgName}.js`,
//     path: path.resolve(__dirname, "dist"),
//     globalObject: "this",
//     library: pkg.name,
//     libraryTarget: "umd",
//     umdNamedDefine: true,
//   },
//   externals: {
//     "monaco-editor": {
//       root: "monaco-editor",
//       commonjs2: "monaco-editor",
//       commonjs: "monaco-editor",
//       amd: "monaco-editor",
//     },
//   },
//   stats: {
//     errorDetails: true,
//   },
// });

const path = require("path");
const webpack = require("webpack");
const pkg = require("./package.json");

const pkgName = "omniwasm-monaco";

module.exports = (env, args) => ({
  target: "web",
  mode: "production",
  resolve: { extensions: [".ts", ".js"] },
  devtool: "source-map",
  module: {
    rules: [{ test: /\.ts?$/, loader: "ts-loader" }],
  },
  entry: "./src/index.ts",
  output: {
    filename: `${pkgName}.js`,
    path: path.resolve(__dirname, "dist"),
    globalObject: "this",
    library: pkg.name,
    libraryTarget: "umd",
    umdNamedDefine: true,
  },
  stats: {
    errorDetails: true,
  },
  externals: {
    "monaco-editor": {
      root: "monaco-editor",
      commonjs2: "monaco-editor",
      commonjs: "monaco-editor",
      amd: "monaco-editor",
    },
    omniwasm: {
      root: "omniwasm",
      commonjs2: "omniwasm",
      commonjs: "omniwasm",
      amd: "omniwasm",
    },
  },
});
