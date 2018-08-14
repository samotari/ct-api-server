'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var EventEmitter = require('events').EventEmitter || require('events');

	var service = _.extend({}, {
		instances: [],
	}, EventEmitter.prototype);

	_.each(app.config.zeromq, function(socketUrls, network) {
		_.each(socketUrls, function(url) {
			var instance = new app.lib.BitcoindZeroMQ({
				network: network,
				dataUrl: url.dataUrl,
				statusUrl: url.statusUrl
			});
			instance.on('tx', function(tx) {
				tx = _.pick(tx, 'address', 'amount', 'txid');
				service.emit('tx:' + network, tx);
			});
			service.instances.push(instance);
		});
	});

	// Periodically log connection status.
	setInterval(function() {
		_.each(service.instances, function(instance) {
			var url = instance.options.statusUrl;
			var isActive = instance.active === true;
			app.log('ZeroMQ connection status (' + url + '):', isActive ? 'ACTIVE' : 'INACTIVE');
		});
	}, app.config.logs.frequency);

	return service;
};
