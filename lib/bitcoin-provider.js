'use strict';

module.exports = function(method) {

	return function(app) {

		var _ = require('underscore');
		var EventEmitter = require('events').EventEmitter || require('events');

		// Extend with node's event emitter.
		var provider = _.extend({
			close: function() {
				app.services.blockCypher.removeListener(newTxEventName, onNewTx);
				app.services.blockIO.removeListener(newTxEventName, onNewTx);
				app.services.insight.removeListener(newTxEventName, onNewTx);
				clearInterval(sentCleanUpInterval);
				sent = null;
			},
		}, EventEmitter.prototype);

		var sent = {};
		var onNewTx = function(tx) {
			var key = _.chain(tx).pick('address', 'amount', 'txid').values().value().join(':');
			if (!sent[key]) {
				provider.emit('tx', tx);
				sent[key] = Date.now();
			}
		};

		// Periodically clean-up the sent object hash.
		var sentCleanUpInterval = setInterval(function() {
			var now = Date.now();
			sent = _.chain(sent).keys().map(function(key) {
				var timeSent = sent[key];
				return now - timeSent > 30000 ? null : [key, timeSent];
			}).compact().object().value();
		}, 30000);

		var newTxEventName = ['tx', method].join(':');
		app.services.blockCypher.on(newTxEventName, onNewTx);
		app.services.blockIO.on(newTxEventName, onNewTx);
		app.services.insight.on(newTxEventName, onNewTx);

		return provider;
	};
};
