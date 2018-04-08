'use strict';

module.exports = {
	integration: {
		options: {
			reporter: 'spec',
			ui: 'bdd',
			timeout: 30000
		},
		src: ['test/integration/**/*.js'],
	},
};
