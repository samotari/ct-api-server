'use strict';

module.exports = function(method) {

	return function(app) {

		var _ = require('underscore');
		var EventEmitter = require('events').EventEmitter || require('events');

		// Extend with node's event emitter.
		var provider = _.extend({
			close: function() {
				app.services.blockCypher.removeListener(anyNewTxEventName, onNewTx);
				app.services.insight.removeListener(anyNewTxEventName, onNewTx);
				clearInterval(sentCleanUpInterval);
				sent = null;
			},
		}, EventEmitter.prototype);

		var sent = {};
		var onNewTx = function(tx) {
			var key = _.values(tx).join(':');
			if (!sent[key]) {
				var eventName = ['tx', tx.address].join(':');
				provider.emit(eventName, tx);
				sent[key] = Date.now();
			}
		};

		// Periodically clean-up the sent object hash.
		var sentCleanUpInterval = setInterval(function() {
			var now = Date.now();
			sent = _.chain(sent).keys().map(function(key) {
				var timeSent = sent[key];
				return now - timeSent > 300000 ? null : [key, timeSent];
			}).compact().object().value();
		}, 30000);

		var anyNewTxEventName = ['tx', method].join(':');
		app.services.blockCypher.on(anyNewTxEventName, onNewTx);
		app.services.insight.on(anyNewTxEventName, onNewTx);

		return provider;
	};
};
