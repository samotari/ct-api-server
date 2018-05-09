'use strict';

module.exports = function(app) {

	var async = require('async');
	var _ = require('underscore');

	var service = app.services.onionMoneroBlockchainExplorer;

	return {

		outputs: function(tx, networkName, cb) {

			var fns = _.map(app.config.onionMoneroBlockchainExplorer[networkName], function(host) {
				return _.bind(service.outputs, service, tx, host);
			});

			async.tryEach(fns, cb);
		},

		getTransactions: function(networkName, cb) {

			var fns = _.map(app.config.onionMoneroBlockchainExplorer[networkName], function(host) {
				return _.bind(service.getTransactions, service, host);
			});

			async.tryEach(fns, cb);
		}
	}
}