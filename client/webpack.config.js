const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    // 1. 入口文件
    entry: "./src/code/main.tsx",

    // 2. 输出配置
    output: {
      // 输出目录，与后端 express.static 路径一致
      path: path.resolve(__dirname, "dist"),
      // 输出的文件名，使用 contenthash 实现长期缓存
      filename: "bundle.[contenthash].js",
      // 每次构建前清理 /dist 文件夹 (Webpack 5 内置功能)
      clean: true,
      // 公共路径，确保资源从根路径加载
      publicPath: '/'
    },

    // 3. 模块解析
    resolve: {
      // 自动解析这些扩展名，导入时可以省略
      extensions: [".ts", ".tsx", ".js", ".json"],
      // 使用 tsconfig-paths-webpack-plugin 来解析 tsconfig.json 中的 "paths"
      plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
    },

    // 4. 模块加载器
    module: {
      rules: [
        {
          test: /\.html$/,
           use: { loader: "html-loader" }
        },
        {
          test: /\.css$/,
           use: ["style-loader", "css-loader"]
        },
        {
          // 使用 ts-loader
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        }
      ]
    },
    // 5. 插件
    plugins: [
      new HtmlWebPackPlugin({
        template: path.resolve(__dirname, "src/index.html"),
        filename: "index.html"
      })
    ],

    // 6. 其他配置
    performance: { hints: false },
    // 在开发模式下开启 watch，生产模式下关闭
    watch: !isProduction,
    // 开发模式使用更快的 source-map，生产模式使用高质量的 source-map
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};
