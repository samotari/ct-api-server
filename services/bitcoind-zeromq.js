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
				url: url,
			});
			instance.on('tx', function(tx) {
				tx = _.pick(tx, 'address', 'amount', 'txid');
				service.emit('tx:' + network, tx);
			});
			service.instances.push(instance);
		});
	});

	return service;
};
