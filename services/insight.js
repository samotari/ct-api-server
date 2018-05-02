'use strict';

module.exports = function(app) {

	var _ = require('underscore');

	var instances = _.mapObject(app.config.insight, function(configs) {
		return _.map(configs, function(config) {
			return new app.lib.Insight(config);
		});
	});

	app.onStart(function(done) {
		_.each(instances, function(instanceArray) {
			_.each(instanceArray, function(instance) {
				instance.connect(function(error) {
					var uri = instance.config.baseUrl;
					if (error) {
						app.error('Failed to connect to insight API (' + uri + ')', error);
					} else {
						app.log('Connected to insight API (' + uri + ')');
					}
				});
			});
		});
		// Don't wait to finish connecting.
		done();
	});

	var findInstanceByName = function(name) {

		for (var method in instances) {
			for (var index = 0; index < instances[method].length; index++) {
				if (instances[method][index].name === name) {
					return instances[method][index];
				}
			}
		}
		return null;
	};

	var isSupportedMethod = function(method) {

		return _.isArray(instances[method]);
	};

	var getAnyConnectedInstanceByMethod = function(method) {

		return _.find(instances[method], function(instance) {
			return instance.socket && instance.socket.connected === true;
		}) || null;
	};

	var listenToAddress = function(method, address, onData) {

		if (!isSupportedMethod(method)) {
			throw new Error('Unsupported payment method');
		}

		var instance = getAnyConnectedInstanceByMethod(method);
		if (!instance) {
			throw new Error('No available API servers for the given payment method. Please try again later.');
		}

		var subscriptionId = instance.listenToAddress(address, onData);
		var extendedSubscriptionId = [instance.name, subscriptionId].join(':');
		return extendedSubscriptionId;
	};

	var unsubscribe = function(extendedSubscriptionId) {

		if (extendedSubscriptionId.indexOf(':') === -1) {
			throw new Error('Invalid subscription ID: "' + extendedSubscriptionId + '"');
		}

		var parts = extendedSubscriptionId.split(':');
		var name = parts[0];
		var subscriptionId = parts[1];
		var instance = findInstanceByName(name);

		if (!instance) {
			throw new Error('Invalid insight API instance name: "' + name + '"');
		}

		instance.unsubscribe(subscriptionId);
	};

	return {
		findInstanceByName: findInstanceByName,
		getAnyConnectedInstanceByMethod: getAnyConnectedInstanceByMethod,
		instances: instances,
		isSupportedMethod: isSupportedMethod,
		listenToAddress: listenToAddress,
		unsubscribe: unsubscribe,
	};
};
