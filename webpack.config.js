const WebpackConfigGenerator = require('./webpackConfigGenerator')

module.exports = (env, argv) => {
	return WebpackConfigGenerator({
		mode: argv.mode,
		entry: {
			app: ['./src/ts/App.ts', './src/sass/style.sass']
		},
		dist: 'dist/',
		favicon: true
	})
}
