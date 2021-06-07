"use strict";

const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssnanoPlugin = require("@intervolga/optimize-cssnano-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const htmlLoader = (minimize) => {
	return {
		loader: "html-loader",
		options: {
			minimize
		}
	};
};

const cssLoaders = (sourceMap) => [
	{
		loader: MiniCssExtractPlugin.loader,
		options: {
			publicPath: ""
		}
	},
	{
		loader: "css-loader",
		options: {
			sourceMap
		}
	},
	{
		loader: "postcss-loader",
		options: {
			sourceMap,
			postcssOptions: {
				plugins: [
					"postcss-import",
					require("autoprefixer")({
						overrideBrowserslist: ["last 2 versions"]
					})
				]
			}
		}
	}
];

const sassLoaders = (sourceMap) => [
	{
		loader: "sass-loader",
		options: {
			sourceMap
		}
	}
];

const jsLoader = {
	loader: "babel-loader",
	options: {
		presets: [
			["@babel/preset-env", {
				useBuiltIns: "entry",
				targets: {
					esmodules: true
				}
			}]
		]
	}
};

const tsLoader = (typeChecking) => {
	return {
		loader: "ts-loader",
		options: {
			transpileOnly: !typeChecking, // Disabling typechecking also disables the generation of source maps (.min.js.map) and declaration files (.d.ts)
		}
	};
}

const shaderLoaders = [
	'raw-loader',
	'glslify-loader'
];

const webpackConfigGenerator = (config) => {
	const devmode = (config.mode === "development");
	const root = process.cwd();
	const completeConfig = {
		mode: "development",
		watch: devmode,
		showErrors: devmode,
		minimize: !devmode,
		typeChecking: devmode,
		sourceMap: true,
		entry: {},
		index: "src/index.html",
		inject: true,
		buildFolder: "build/",
		favicon: null,
		...config
	};
	console.log("----------------------------------------");
	console.log("Webpack Configuration:");
	console.log(completeConfig);
	console.log("----------------------------------------");
	return {
		mode: completeConfig.mode,
		entry: completeConfig.entry,
		output: {
			filename: "[name].min.js",
			path: path.join(root, completeConfig.buildFolder),
			publicPath: ""
		},
		devtool: (completeConfig.sourceMap ? (devmode ? "eval-source-map" : "source-map") : false),
		devServer: {
			contentBase: path.join(root, completeConfig.buildFolder),
			hot: completeConfig.watch,
			watchContentBase: completeConfig.watch,
			clientLogLevel: "warn"
		},
		resolve: {
			modules: ["src", "node_modules"],
			preferRelative: true,
			extensions: [".css", ".sass", ".scss", ".js", ".jsx", ".ts", ".tsx", ".json", ".ico", ".png", ".svg", ".jpg", ".jpeg", ".gif", ".webp", ".eot", ".otf", ".ttf", ".woff", ".woff2", ".txt"],
		},
		module: {
			rules: [
				{
					test: /\.html$/i,
					use: htmlLoader(completeConfig.minimize)
				},
				{
					test: /\.css$/i,
					use: cssLoaders(completeConfig.sourceMap)
				},
				{
					test: /\.s[ac]ss$/i,
					use: [...cssLoaders(completeConfig.sourceMap), ...sassLoaders(completeConfig.sourceMap)]
				},
				{
					test: /\.jsx?$/i,
					exclude: /(node_modules|bower_components)/,
					use: jsLoader
				},
				{
					test: /\.tsx?$/i,
					use: tsLoader(true)
				},
				{
					test: /\.(ico|png|svg|jpe?g|gif|webp)$/i,
					type: "asset/resource",
					generator: {
						filename: "img/[contenthash][ext][query]"
					}
				},
				{
					test: /\.(eot|otf|ttf|woff2?)$/i,
					type: "asset/resource",
					generator: {
						filename: "fnt/[contenthash][ext][query]"
					}
				},
				{
					test: /\.txt$/i,
					type: "asset/source",
					generator: {
						filename: "txt/[contenthash][ext][query]"
					}
				},
				{
					test: /\.(glb|gltf)$/i,
					type: "asset/resource",
					generator: {
						filename: "models/[contenthash][ext][query]"
					}
				},
				{
					test: /\.(glsl|vs|fs|vert|frag)$/i,
					use: shaderLoaders
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			...(completeConfig.index != null ? [new HtmlWebpackPlugin({
				filename: "index.html",
				template: completeConfig.index,
				minify: completeConfig.minimize,
				cache: true,
				inject: completeConfig.inject,
				meta: {
					viewport: "width=device-width, initial-scale=1, shrink-to-fit=no"
				},
				showErrors: completeConfig.showErrors
			})] : []),
			new MiniCssExtractPlugin({
				filename: "[name].min.css",
				chunkFilename: "[id].min.css"
			}),
			new OptimizeCssnanoPlugin({
				cssnanoOptions: {
					preset: ["default", {
						discardComments: {
							removeAll: true,
						}
					}]
				}
			}),
			...(completeConfig.typeChecking === true ? [
				new ForkTsCheckerWebpackPlugin()
			] : []),
			...(typeof completeConfig.favicon === "string" ? [
				new FaviconsWebpackPlugin({
					logo: completeConfig.favicon,
					publicPath: "./",
					prefix: "img/icons/",
					emitStats: false,
					statsFilename: "iconstats-[contenthash].json",
					persistentCache: false,
					inject: true,
					background: "#fff",
					icons: {
						android: true,
						appleIcon: true,
						appleStartup: true,
						coast: false,
						favicons: true,
						firefox: true,
						opengraph: false,
						twitter: true,
						yandex: true,
						windows: true
					}
				})
			] : []),
			...(completeConfig.watch === true ? [
				new webpack.HotModuleReplacementPlugin()
			] : []),
			new CopyPlugin({
				patterns: [
					{ from: "src/static", to: "static", noErrorOnMissing: true }
				],
			}),
		]
	};
};

module.exports = webpackConfigGenerator;
