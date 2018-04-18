'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var Insight = require('../lib/insight');

	var instances = _.mapObject(app.config.insight, function(config, method) {
		var instance = new Insight(config);
		instance.method = method;
		return instance;
	});

	app.onStart(function(done) {
		async.each(instances, function(instance, next) {
			instance.connect(function(error) {
				if (error) {
					app.error('Failed to connect to insight API (' + instance.method + ')', error);
				} else {
					app.log('Connected to insight API (' + instance.method + ')');
				}
			});
			next();
		}, done);
	});

	return instances;
};
