'use strict';

/*
	https://www.blockcypher.com/dev/bitcoin/?javascript#using-websockets
*/
module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var EventEmitter = require('events').EventEmitter || require('events');
	var WebSocket = require('ws');

	_.each(app.config.blockCypher.networks, function(network, networkName) {
		var ws = new WebSocket('wss://' + network.ws);
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
						var eventName = ['tx', networkName, address].join(':');
						var tx = {
							value: output.value,
						};
						service.emit(eventName, tx);
					});
				}
			});
		});
	});

	var service = {};

	// Provide event emitter methods.
	service = _.extend(service, EventEmitter.prototype);

	return service;
};
