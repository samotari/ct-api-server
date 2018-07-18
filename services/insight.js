'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var EventEmitter = require('events').EventEmitter || require('events');

	// Provide event emitter methods.
	var service = _.extend({

		instances: [],

		addInstance: function(options, network) {

			options = _.extend({}, options, {
				debug: app.config.debug,
			});

			var instance = new app.lib.Insight(options);
			var uri = options.url;

			if (uri) {

				instance.connect(function(error) {
					if (error) {
						app.log('Failed to connect to', uri, error);
					}
				});

				instance.on('connect', function() {
					app.log('Connected to Insight API at ' + uri);
				});

				instance.on('disconnect', function() {
					app.log('Disconnected from Insight API at ' + uri);
				});
			}

			instance.on('tx', function(tx) {
				service.emit('tx:' + network, tx);
			});

			service.instances.push(instance);

			return instance;
		},

	}, EventEmitter.prototype);

	_.each(app.config.insight.hosts, function(optionsArray, network) {
		_.each(optionsArray, function(options) {
			service.addInstance(options, network);
		});
	});

	// Periodically log connection status.
	setInterval(function() {
		_.each(service.instances, function(instance) {
			var uri = instance.options.url;
			var isConnected = instance.socket.connected === true;
			app.log('Insight connection status (' + uri + '):', isConnected ? 'OK' : 'DISCONNECTED');
		});
	}, 5 * 60 * 1000);

	return service;
};
