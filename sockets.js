'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var Primus = require('primus');
	var querystring = require('querystring');
	var WebSocket = require('uws');
	var primus = new Primus(app.server, app.config.primus);
	var subscriptions = {};

	primus.on('connection', function(spark) {

		spark.once('end', function() {
			spark.removeAllListeners('data');
			unsubscribeFromAll(spark);
		});

		// Send an error to the socket client.
		spark.error = function(error) {
			if (!_.isString(error)) {
				throw new Error('Only call spark.error() with an error string.');
			}
			spark.write({
				error: error,
			});
		};

		spark.on('data', function(data) {
			var action = data.action;
			switch (action) {
				case 'join':
				case 'leave':
					// Subscribe to or unsubscribe from a channel.
					var channel = data.channel;
					if (channel && _.isString(channel)) {
						if (action === 'join') {
							subscribe(channel, spark);
						} else {
							unsubscribe(channel, spark);
						}
					} else {
						// Missing channel name.
					}
					break;
				default:
					// Unknown action.
					break;
			}
		});
	});

	if (app.config.webRoot) {
		primus.save(app.config.webRoot + '/primus/primus.js');
	}

	var cache = {};

	var handlers = {
		'address-balance-updates?': {
			subscribe: function(channel, spark) {
				var params = querystring.parse(channel.split('?')[1]);
				var method = params.method;
				var address = params.address;
				if (!app.services.insight[method]) {
					return spark.error('Unknown insight API (' + method + ')');
				}
				var subscriptionId = app.services.insight[method].listenToAddress(address, function(data) {
					broadcast(channel, data);
				});
				spark.insight = spark.insight || {};
				spark.insight[channel] = subscriptionId;
			},
			unsubscribe: function(channel, spark) {
				spark.insight = spark.insight || {};
				var subscriptionId = spark.insight[channel];
				if (!subscriptionId || subscriptionId.indexOf(':') === -1) return;
				var method = subscriptionId.split(':')[0];
				if (!app.services.insight[method]) {
					return spark.error('Unknown insight API (' + method + ')');
				}
				app.services.insight[method].unsubscribe(subscriptionId);
			},
		},
		'get-monero-transactions?': {
			subscribe: function(channel) {
				var params = querystring.parse(channel.split('?')[1]);
				async.whilst(
					function() { return hasSubscriptions(channel); },
					function(callback) {
						app.services.xmrchain.getTransactions(params.networkName, function(error, data) {
							if (error) {
								app.error(error);
								_.delay(callback, 30 * 1000/* 30 seconds */);
								return;
							}
							cache[channel] = data;
							broadcast(channel, data);
							_.delay(callback, 5 * 1000/* 5 seconds */);
						})
					}
				);
			}
		}
	};

	var subscribe = function(channel, spark) {
		subscriptions[channel] = subscriptions[channel] || {};
		subscriptions[channel][spark.id] = spark;
		if (cache[channel]) {
			spark.write({
				channel: channel,
				data: cache[channel],
			});
		}
		_.each(handlers, function(handler, searchText) {
			if (handler.subscribe && channel.substr(0, searchText.length) === searchText) {
				handler.subscribe(channel, spark);
				// Break the _.each loop.
				return false;
			}
		});
	};

	var unsubscribeFromAll = function(spark) {
		var channels = _.keys(subscriptions);
		_.each(channels, function(channel) {
			unsubscribe(channel, spark);
		});
	};

	var unsubscribe = function(channel, spark) {
		subscriptions[channel] = subscriptions[channel] || {};
		delete subscriptions[channel][spark.id];
		_.each(handlers, function(handler, searchText) {
			if (handler.unsubscribe && channel.substr(0, searchText.length) === searchText) {
				handler.unsubscribe(channel, spark);
				// Break the _.each loop.
				return false;
			}
		});
	};

	var hasSubscriptions = function(channel) {
		return _.values(subscriptions[channel]).length > 0;
	};

	// Send data to all sockets currently subscribed to a specific channel.
	var broadcast = function(channel, data) {
		_.each(subscriptions[channel], function(spark) {
			spark.write({
				channel: channel,
				data: data,
			});
		});
	};

	(function getExchangeRates() {
		app.providers.exchangeRates(function(error, rates) {
			if (error) {
				_.delay(getExchangeRates, 30 * 1000/* 30 seconds */);
				return;
			}
			var channel = 'exchange-rates';
			cache[channel] = rates;
			broadcast(channel, rates);
			_.delay(getExchangeRates, 5 * 60 * 1000/* 5 minutes */);
		});
	})();

	return {
		broadcast: broadcast,
		subscriptions: subscriptions,
		primus: primus,
	};
};
