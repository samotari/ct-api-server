'use strict';

module.exports = {
	integration: {
		options: {
			reporter: 'spec',
			ui: 'bdd'
		},
		src: ['test/integration/**/*.js'],
	},
	unit: {
		options: {
			reporter: 'spec',
			ui: 'bdd'
		},
		src: ['test/unit/**/*.js'],
	},
};
