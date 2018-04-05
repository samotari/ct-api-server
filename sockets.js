'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var Primus = require('primus');
	var querystring = require('querystring');
	var primus = new Primus(app.server, app.config.primus);
	var subscriptions = {};

	primus.on('connection', function(spark) {
		console.log('client connected');
		spark.once('end', function() {
			console.log('spark.end');
			spark.removeAllListeners('data');
			unsubscribeFromAll(spark);
		});
		spark.on('data', function(data) {
			console.log('spark.data', data);
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

	var cache = {};

	var handlers = {
		'address-balance-updates?': {
			subscribe: function(channel) {
				// var params = querystring.parse(channel.split('?')[1]);
				// app.services['<some service>'].listenToAddress(params.address, params.method, function(data) {
				// 	broadcast(channel, data);
				// });
			},
			unsubscribe: function(channel) {
				// if (hasSubscriptions(channel)) return;
				// var params = querystring.parse(channel.split('?')[1]);
				// app.services['<some service>'].stopListeningToAddress(params.address, params.method, function(data) {
				// 	broadcast(channel, data);
				// });
			},
		}
	};

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
		_.each(handlers, function(handler, searchText) {
			if (handler.subscribe && channel.substr(0, searchText.length) === searchText) {
				handler.subscribe(channel);
				// Break the _.each loop.
				return false;
			}
		});
	};

	var unsubscribeFromAll = function(spark) {
		subscriptions = _.mapObject(subscriptions, function(sparks) {
			delete sparks[spark.id];
			return sparks;
		});
	};

	var unsubscribe = function(channel, spark) {
		console.log('client unsubscribed from "' + channel + '"');
		subscriptions[channel] = subscriptions[channel] || {};
		delete subscriptions[channel][spark.id];
		_.each(handlers, function(handler, searchText) {
			if (handler.unsubscribe && channel.substr(0, searchText.length) === searchText) {
				handler.unsubscribe(channel);
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
				console.log(error);
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
