'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var querystring = require('querystring');
	var request = require('request');

	return {
		hostname: {
			mainnet: 'xmrchain.com',
			testnet: 'testnet.xmrchain.com',
		},
		getBlockExplorerUrl: function(uri, networkName) {

			var hostname = this.hostname[networkName];
			return 'https://' + hostname + uri;
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
				cb(null, data);
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
				cb(null, data);
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
};