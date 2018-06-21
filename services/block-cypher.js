'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var EventEmitter = require('events').EventEmitter || require('events');

	// Provide event emitter methods.
	var service = _.extend({}, EventEmitter.prototype);

	service.instances = _.map(app.config.blockCypher.networks, function(network, method) {

		var config = {
			method: method,
			network: network,
		};

		var instance = new app.lib.BlockCypher(config);

		instance.connect(function(error) {
			if (error) {
				app.log('Failed to connect to', network.ws, error);
			} else {
				app.log('Connected to', network.ws);
			}
		});

		return instance;
	});

	return service;
};
