'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var querystring = require('querystring');
	var request = require('request');
	var async = require('async');

	return {

		getBlockExplorerUrl: function(uri, networkHost) {

			return 'https://' + networkHost + uri;
		},

		getTransactions: function(networkHost, cb) {

			async.parallel({
				confirmed: _.bind(this.getRecentConfirmedTransactions, this, networkHost),
				mempool: _.bind(this.getMemPoolTransactions, this, networkHost),
			}, function(error, results) {

				if (error) {
					return cb(error);
				}

				var txs = [];
				txs.push.apply(txs, results.confirmed);
				txs.push.apply(txs, results.mempool);
				cb(null, txs);
			});
		},

		getMemPoolTransactions: function(networkHost, cb) {
			var uri = this.getBlockExplorerUrl('/api/mempool', networkHost);
			request(uri, function(error, response, data) {
				if (error) {
					return cb(error);
				}
				try {
					data = JSON.parse(data);
				} catch (error) {
					return cb(error);
				}
				cb(null, data.data.txs);
			});
		},

		getRecentConfirmedTransactions: function(networkHost, cb) {

			var uri = this.getBlockExplorerUrl('/api/transactions', networkHost);

			request(uri, function(error, response, data) {
				if (error) {
					return cb(error);
				}
				try {
					data = JSON.parse(data);
				} catch (error) {
					return cb(error);
				}

				var txs = [];
				_.each(data.data.blocks, function(block) {
					txs.push.apply(txs, block.txs);
				});
				cb(null, txs);
			});
		},

		outputs: function(tx, networkHost, cb) {

			var uri = this.getBlockExplorerUrl('/api/outputs', networkHost);

			uri += '?' + querystring.stringify({
				txhash: tx.txhash,
				address: tx.address,
				viewkey: tx.viewkey,
				txprove: tx.txprove,
			});

			request(uri, function(error, response, data) {
				if (error) {
					return cb(error);
				}
				try {
					data = JSON.parse(data);
				} catch (error) {
					return cb(error);
				}
				cb(null, data);
			});
		},
	};
}