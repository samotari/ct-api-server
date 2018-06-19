'use strict';

/*
	https://www.blockcypher.com/dev/bitcoin/?javascript#using-websockets
*/
module.exports = function(app) {

	var _ = require('underscore');
	var EventEmitter = require('events').EventEmitter || require('events');
	var WebSocket = require('ws');

	_.each(app.config.blockCypher.networks, function(network, method) {
		var ws = new WebSocket(network.ws);
		ws.on('open', function() {
			app.log('connected to', network.ws);
			// Subscribe to new, unconfirmed transactions.
			ws.send(JSON.stringify({ event: 'unconfirmed-tx' }));
		});
		ws.on('message', function(data) {
			data = JSON.parse(data);
			_.each(data.outputs, function(output) {
				if (!_.isEmpty(output.addresses)) {
					_.each(output.addresses, function(address) {
						var eventName = ['tx', method].join(':');
						var tx = {
							address: address,
							value: output.value,
						};
						service.emit(eventName, tx);
					});
				}
			});
		});
	});

	// Provide event emitter methods.
	var service = _.extend({}, EventEmitter.prototype);

	return service;
};
