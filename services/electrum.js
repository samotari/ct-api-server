'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	var service = {

		isSupportedNetwork: function(network) {

			return !!this.instances[network];
		},

		cmd: function(network, method, params, cb) {

			if (!this.isSupportedNetwork(network)) {
				return cb(new Error('Unsupported network: "' + network + '"'));
			}

			this.instances[network].cmd(method, params, cb);
		},

		resetInstances: function() {

			this.instances = {};
		},

		prepareInstances: function() {

			this.instances = _.mapObject(app.config.electrum, function(options, network) {
				return new app.lib.Electrum(options);
			});
		},
	};

	service.prepareInstances();

	return service;
};
