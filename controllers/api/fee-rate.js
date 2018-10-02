'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	app.get('/api/v1/fee-rate', function(req, res, next) {

		try {
			var requiredQueryParams = ['network'];
			_.each(requiredQueryParams, function(key) {
				if (!req.query[key]) {
					var error = new Error('"' + key + '" required');
					error.status = 400;
					throw new Error(error);
				}
			});
			var network = req.query.network;
			if (!app.services.electrum.isSupportedNetwork(network)) {
				throw new Error('Unsupported network: "' + network + '"');
			}
		} catch (error) {
			error.status = 400;
			return next(error);
		}

		app.services.electrum.cmd(network, 'getfeerate', function(error, result) {
			if (error) return next(error);
			res.status(200).json(result);
		});
	});
};