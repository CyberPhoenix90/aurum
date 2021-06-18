const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const baseConfig = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: {
		'aurum.content': './src/aurum.content.ts',
		'aurum.devtools': './src/aurum.devtools.ts',
		'aurum.background': './src/aurum.background.ts',
		'aurum.devtoolspage': './src/aurum.devtoolspage.tsx'
	},
	output: {
		filename: '[name].bundle.js',
		path: path.join(__dirname, '/dist'),
		publicPath: '/'
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: './manifest.json', to: './manifest.json' },
				{ from: './aurum.devtools.html', to: './aurum.devtools.html' },
				{ from: './aurum.devtoolspage.html', to: './aurum.devtoolspage.html' }
			]
		})
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules|dist/
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
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

module.exports = baseConfig;
