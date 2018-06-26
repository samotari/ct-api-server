'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var request = require('request');
	var querystring = require('querystring');

	return {

		getBlockExplorerUrl: function(uri, baseUrl) {

			return baseUrl + uri;
		},

		getTransactions: function(baseUrl, cb) {

			async.parallel({
				confirmed: _.bind(this.getRecentConfirmedTransactions, this, baseUrl),
				mempool: _.bind(this.getMemPoolTransactions, this, baseUrl),
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

		getMemPoolTransactions: function(baseUrl, cb) {
			var uri = this.getBlockExplorerUrl('/api/mempool', baseUrl);
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

		getRecentConfirmedTransactions: function(baseUrl, cb) {

			var uri = this.getBlockExplorerUrl('/api/transactions', baseUrl);

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

		outputs: function(tx, baseUrl, cb) {

			var uri = this.getBlockExplorerUrl('/api/outputs', baseUrl);

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