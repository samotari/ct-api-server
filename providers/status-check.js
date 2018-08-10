'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	var service = app.services.bitcoindZeroMQ;
	var networks = _.keys(app.lib.BitcoindZeroMQ.prototype.networks);

	return {

		getStatuses: function() {
			var instances = _.map(service.instances, function(instance) {

				return {
					name: instance.options && instance.options.network,
					active: instance.active || false,
				}
			});

			var statuses = _.map(networks, function(network) {
				return _.chain(instances)
					.filter(function(instance) {
						return instance.name === network;
					})
					.some(function(instance) {
						return instance.active;
					})
					.value();
			});

			return _.object(networks, statuses);
		}
	}
};
