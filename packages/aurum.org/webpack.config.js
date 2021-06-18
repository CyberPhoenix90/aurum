const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: {
		app: './src/setup.ts'
	},
	externals: ['vs/editor/editor.main'],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules|dist/
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.less$/i,
				exclude: /node_modules|dist/,
				use: [
					// Creates `style` nodes from JS strings
					'style-loader',
					// Translates CSS into CommonJS
					'css-loader',
					// Compiles Sass to CSS
					'less-loader'
				]
			}
		]
	},
	resolve: {
		alias: {
			aurumjs: path.resolve(__dirname, '../../node_modules/aurumjs')
		},
		extensions: ['.tsx', '.ts', '.js']
	},
	output: {
		publicPath: './',
		globalObject: 'self',
		filename: 'static/js/[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	devServer: {
		watchContentBase: true,
		publicPath: '/dist/',
		hot: true,
		contentBase: ['.'],
		inline: true
	},
	optimization: {
		usedExports: true
	}
};
