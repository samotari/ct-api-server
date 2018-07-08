'use strict';

module.exports = function(method) {

	return function(app) {

		var _ = require('underscore');
		var EventEmitter = require('events').EventEmitter || require('events');

		// Extend with node's event emitter.
		var provider = _.extend({
			getRecentTxsForAddress: function(address, maxAge) {
				var now = Date.now();
				return _.chain(sent[address] || {}).map(function(details, txid) {
					if (maxAge) {
						var timestamp = details.t;
						var isOld = now - timestamp > maxAge;
						if (isOld) return null;
					}
					return {
						amount: details.a,
						txid: txid,
					};
				}).compact().value();
			},
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
			if (!sent[tx.address] || !sent[tx.address][tx.txid]) {
				sent[tx.address] = sent[tx.address] || {};
				sent[tx.address][tx.txid] = {
					a: tx.amount,// amount
					t: Date.now(),// timestamp
				};
				provider.emit('tx', tx);
			}
		};

		// Periodically clean-up the sent object hash.
		var sentCleanUpInterval = setInterval(function() {
			var now = Date.now();
			sent = _.chain(sent).map(function(txIds, address) {
				txIds = _.chain(txIds).map(function(details, txid) {
					var timestamp = details.t;
					return now - timestamp > 20000 ? null : [txid, details];
				}).compact().object().value();
				return _.isEmpty(txIds) ? null : [address, txIds];
			}).compact().object().value();
		}, 30000);

		var newTxEventName = ['tx', method].join(':');
		app.services.blockCypher.on(newTxEventName, onNewTx);
		app.services.blockIO.on(newTxEventName, onNewTx);
		app.services.insight.on(newTxEventName, onNewTx);

		return provider;
	};
};
