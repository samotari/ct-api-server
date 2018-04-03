'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var Primus = require('primus');
	var primus = new Primus(app.server, app.config.primus);
	var subscriptions = {};

	primus.on('connection', function(spark) {
		console.log('client connected');
		spark.on('data', function(data) {
			console.log('spark.data', data);
			var action = data.action;
			switch (action) {
				case 'join':
				case 'leave':
					// Subscribe to or unsubscribe from a channel.
					var channel = data.channel;
					if (channel) {
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

	var cache = {};

	var subscribe = function(channel, spark) {
		console.log('client subscribed to "' + channel + '"');
		subscriptions[channel] = subscriptions[channel] || {};
		subscriptions[channel][spark.id] = spark;
		if (cache[channel]) {
			spark.write({
				channel: channel,
				data: cache[channel],
			});
		}
	};

	var unsubscribe = function(channel, spark) {
		console.log('client unsubscribed from "' + channel + '"');
		subscriptions[channel] = subscriptions[channel] || {};
		delete subscriptions[channel][spark.id];
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
				console.log(error);
				_.delay(getExchangeRates, 20 * 1000/* 30 seconds */);
				return;
			}
			var name = 'exchange-rates';
			cache[name] = rates;
			broadcast(name, rates);
			_.delay(getExchangeRates, 5 * 60 * 1000/* 5 minutes */);
		});
	})();

	return {
		broadcast: broadcast,
		subscriptions: subscriptions,
		primus: primus,
	};
};
