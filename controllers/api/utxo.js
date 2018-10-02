'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');

	app.get('/api/v1/utxo', function(req, res, next) {

		try {
			var requiredQueryParams = ['addresses', 'network'];
			_.each(requiredQueryParams, function(key) {
				if (!req.query[key]) {
					var error = new Error('"' + key + '" required');
					throw new Error(error);
				}
			});
			var network = req.query.network;
			if (!app.services.electrum.isSupportedNetwork(network)) {
				throw new Error('Unsupported network: "' + network + '"');
			}
			if (!_.isString(req.query.addresses)) {
				throw new Error('Invalid parameter: "addresses"')
			}
			var addresses = _.compact(req.query.addresses.split(','));
			if (_.isEmpty(addresses)) {
				throw new Error('Must provide at least one address');
			}
		} catch (error) {
			error.status = 400;
			return next(error);
		}

		async.map(addresses, function(address, next) {
			app.services.electrum.cmd(network, 'getaddressunspent', [address], function(error, utxo) {
				if (error) return next(error);
				var result = {
					address: address,
					utxo: utxo,
				};
				next(null, result);
			});
		}, function(error, results) {

			if (error) {
				return next(error);
			}

			res.status(200).json(results);
		});
	});
};