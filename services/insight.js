'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');

	var instances = _.mapObject(app.config.insight.hosts, function(configs, method) {
		return _.map(configs, function(config) {
			config.debug = app.config.debug === true;
			var instance = new app.lib.Insight(config);
			instance.method = method;
			return instance;
		});
	});

	var subscriptions = {};

	var reassignInstanceSubscriptions = function(name) {
		var previousInstance = findInstanceByName(name);
		if (!previousInstance) return;
		var method = previousInstance.method;
		_.each(subscriptions[method] || {}, function(subscription, serviceSubId) {
			if (subscription[0] !== name) return;
			var instanceSubId = subscription[1];
			var address = subscription[2];
			var onData = subscription[3];
			previousInstance.unsubscribe(instanceSubId);
			delete subscriptions[method][serviceSubId];
			listenToAddress(method, address, onData, function(error) {
				if (error) app.log(error);
			});
		});
	};

	app.onStart(function(done) {

		_.each(instances, function(instanceArray) {
			_.each(instanceArray, function(instance) {
				connectToInstance(instance);
			});
		});

		// Periodically log the connection status of all insight instances.
		setInterval(function() {
			_.each(instances, function(instanceArray) {
				_.each(instanceArray, function(instance) {
					var uri = instance.config.baseUrl;
					app.log('Insight connection status (' + uri + '):', instance.socket.connected ? 'OK' : 'DISCONNECTED');
				});
			});
		}, 5 * 60 * 1000);

		// Don't wait to finish connecting.
		done();
	});

	var connectToInstance = function(instance, done) {

		instance.connect(function(error) {
			var uri = instance.config.baseUrl;
			if (error) {
				app.error('Failed to connect to insight API (' + uri + ')', error);
				return done && done(error);
			}
			app.log('Connected to insight API (' + uri + ')');
			instance.socket.on('disconnect', function() {
				reassignInstanceSubscriptions(instance.name);
			});
			done && done();
		});
	};

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

	var listenToAddress = function(method, address, onData, cb) {

		if (!isSupportedMethod(method)) {
			return cb(new Error('Unsupported payment method'));
		}

		var startTime = Date.now();
		var maxWaitTime = app.config.insight.listenToAddress.timeout;
		var instance;
		var test = function() {
			return !!instance || (Date.now() - startTime) > maxWaitTime;
		};
		var iteratee = function(next) {
			instance = getAnyConnectedInstanceByMethod(method);
			_.delay(next, !instance ? 25 : 0);
		};

		async.until(test, iteratee, function() {

			if (!instance) {
				return cb(new Error('No available API servers for the given payment method. Please try again later.'));
			}

			try {
				var instanceSubId = instance.listenToAddress(address, onData);
			} catch (error) {
				return cb(error);
			}

			var serviceSubId = _.uniqueId(method + '-');
			subscriptions[method] = subscriptions[method] || {};
			subscriptions[method][serviceSubId] = [instance.name, instanceSubId, address, onData];
			cb(null, serviceSubId);
		});
	};

	var unsubscribe = function(serviceSubId) {

		if (serviceSubId.indexOf('-') === -1) {
			throw new Error('Invalid subscription ID');
		}

		var parts = serviceSubId.split('-');
		var method = parts[0];
		var subscription = subscriptions[method] && subscriptions[method][serviceSubId];

		if (subscription) {
			var name = subscription[0];
			var instanceSubId = subscription[1];
			var instance = findInstanceByName(name);
			if (!instance) {
				throw new Error('Invalid insight API instance name: "' + name + '"');
			}
			instance.unsubscribe(instanceSubId);
		}
	};

	var clearSubscriptions = function() {
		subscriptions = {};
	};

	return {
		clearSubscriptions: clearSubscriptions,
		connectToInstance: connectToInstance,
		findInstanceByName: findInstanceByName,
		getAnyConnectedInstanceByMethod: getAnyConnectedInstanceByMethod,
		instances: instances,
		isSupportedMethod: isSupportedMethod,
		listenToAddress: listenToAddress,
		subscriptions: subscriptions,
		unsubscribe: unsubscribe,
	};
};
