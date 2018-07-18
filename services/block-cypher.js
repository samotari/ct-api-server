'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var EventEmitter = require('events').EventEmitter || require('events');

	// Provide event emitter methods.
	var service = _.extend({

		instances: [],

		addInstance: function(options, network) {

			options = _.extend({}, options, {
				debug: app.config.debug,
			});

			var instance = new app.lib.BlockCypher(options);
			var uri = options.url;

			if (uri) {

				instance.connect(function(error) {
					if (error) {
						app.log('Failed to connect to', uri, error);
					}
				});

				instance.on('connect', function() {
					app.log('Connected to BlockCypher at ' + uri);
				});

				instance.on('disconnect', function() {
					app.log('Disconnected from BlockCypher at ' + uri);
				});
			}

			instance.on('tx', function(tx) {
				service.emit('tx:' + network, tx);
			});

			service.instances.push(instance);

			return instance;
		},

	}, EventEmitter.prototype);

	_.bindAll(service, 'addInstance');
	_.each(app.config.blockCypher.networks, service.addInstance);

	// Periodically log connection status.
	setInterval(function() {
		_.each(service.instances, function(instance) {
			var uri = instance.options.url;
			var isConnected = instance.connected === true;
			app.log('BlockCypher connection status (' + uri + '):', isConnected ? 'OK' : 'DISCONNECTED');
		});
	}, 5 * 60 * 1000);

	return service;
};
