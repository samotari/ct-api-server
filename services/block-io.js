'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var EventEmitter = require('events').EventEmitter || require('events');

	// Provide event emitter methods.
	var service = _.extend({}, EventEmitter.prototype);

	var networkNames = {
		'BTC': 'bitcoin',
		'LTC': 'litecoin',
	};

	service.instance = (function() {

		var uri = app.config.blockIO.url;

		var instance = new app.lib.BlockIO({
			url: uri,
			networks: app.config.blockIO.networks,
		});

		if (uri) {

			instance.connect(function(error) {
				if (error) {
					app.log('Failed to connect to', uri, error);
				}
			});

			instance.on('connect', function() {
				app.log('Connected to BlockIO at ' + uri);
			});

			instance.on('disconnect', function() {
				app.log('Disconnected from BlockIO at ' + uri);
			});

			_.each(app.config.blockIO.networks, function(network) {
				instance.on('tx:' + network, function(tx) { 
					var networkName = networkNames[network];
					service.emit('tx:' + networkName, tx);
				});
			});
		}

		return instance;

	})();

	// Periodically log connection status.
	setInterval(function() {
		var instance = service.instance;
		var uri = instance.options.url;
		var isConnected = instance.connected === true;
		app.log('BlockIO connection status (' + uri + '):', isConnected ? 'OK' : 'DISCONNECTED');
	}, 5 * 60 * 1000);

	return service;
};
