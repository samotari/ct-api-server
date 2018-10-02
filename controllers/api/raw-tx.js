'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	app.post('/api/v1/raw-tx', function(req, res, next) {

		try {
			var requiredFields = ['rawTx', 'network'];
			_.each(requiredFields, function(key) {
				if (!req.body[key]) {
					var error = new Error('"' + key + '" required');
					error.status = 400;
					throw new Error(error);
				}
			});

			var network = req.body.network;
			if (!app.services.electrum.isSupportedNetwork(network)) {
				throw new Error('Unsupported network: "' + network + '"');
			}

			var rawTx = req.body.rawTx;

		} catch (error) {
			error.status = 400;
			return next(error);
		}

		app.services.electrum.cmd(network, 'broadcast', [rawTx], function(error, result) {
			if (error) return next(error);
			var txid = result && result[0] === true && result[1] || null;
			if (!txid) {
				return next(new Error('Unexpected result from Electrum.broadcast method'));
			}
			res.status(200).json({ txid: txid });
		});
	});
};