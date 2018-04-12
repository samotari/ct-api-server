'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	app.get('/api/v1/monero/outputs', function(req, res, next) {

		var networkName = req.query.network;
		var networks = _.keys(app.services.xmrchain.hostname);
		var tx = {
			txhash: req.query.txhash,
			address: req.query.address,
			viewkey: req.query.viewkey,
			txprove: req.query.txprove
		}

		if (!networkName) {
			var error = new Error('"networkName" required');
			error.status = 400;
			return next(error);
		}

		if (!_.contains(networks, networkName)) {
			var error = new Error('"' + networkName + '" is not supported');
			error.status = 400;
			return next(error);
		}

		networkName = networkName.toLowerCase();

		app.services.xmrchain.outputs(tx, networkName, function(error, results) {

			if (error) {
				return next(error);
			}

			res.status(200).json(results);
		})

	});
}
