'use strict';

if (process.env.NODE_ENV !== 'test') {
	throw new Error('NODE_ENV must be set to "test" to run tests');
}

var _ = require('underscore');
var app = require('../');
var Client = require('./client');

var manager = module.exports = {

	config: app.config,

	url: function(uri) {

		return 'http://' + manager.config.host + ':' + manager.config.port + uri;
	},

	app: function() {

		return app;
	},

	client: function(options) {

		options = _.defaults(options || {}, {
			host: app.config.host,
			port: app.config.port
		});

		return new Client(options);
	},
};

// Global hooks:
before(app.onReady);
