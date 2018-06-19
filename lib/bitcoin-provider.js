'use strict';

module.exports = function(method) {

	return function(app) {

		var _ = require('underscore');
		var EventEmitter = require('events').EventEmitter || require('events');

		// Extend with node's event emitter.
		var provider = _.extend({}, EventEmitter.prototype);

		var anyNewTxEventName = ['tx', method].join(':');
		app.services.blockCypher.on(anyNewTxEventName, function(tx) {
			var eventName = ['tx', tx.address].join(':');
			provider.emit(eventName, tx);
		});
		app.services.insight.on(anyNewTxEventName, function(tx) {
			var eventName = ['tx', tx.address].join(':');
			provider.emit(eventName, tx);
		});

		return provider;
	};
};
