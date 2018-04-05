'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var querystring = require('querystring');
	var request = require('request');
	var async = require('async');

	return {

		hostname: {
			mainnet: 'xmrchain.com',
			testnet: 'testnet.xmrchain.com',
		},

		getBlockExplorerUrl: function(uri, networkName) {

			var hostname = this.hostname[networkName];
			return 'https://' + hostname + uri;
		},

		getTransactions: function(networkName, cb) {

			async.parallel({
				confirmed: _.bind(this.getRecentConfirmedTransactions, this, networkName),
				mempool: _.bind(this.getMemPoolTransactions, this, networkName),
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

		getMemPoolTransactions: function(networkName, cb) {
			var uri = this.getBlockExplorerUrl('/api/mempool', networkName);

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

		getRecentConfirmedTransactions: function(networkName, cb) {

			var uri = this.getBlockExplorerUrl('/api/transactions', networkName);
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

		outputs: function(tx, networkName, cb) {

			var uri = this.getBlockExplorerUrl('/api/outputs', networkName);

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