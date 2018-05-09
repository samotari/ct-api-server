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
			if (_.isObject(error) && error.message) {
				error = error.message;
			}
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

	var cache = {};

	var handlers = {
		'address-balance-updates?': {
			subscribe: function(channel, spark) {
				var params = querystring.parse(channel.split('?')[1]);
				var method = params.method;
				var address = params.address;
				try {
					var subscriptionId = app.services.insight.listenToAddress(method, address, function(data) {
						broadcast(channel, data);
					});
				} catch (error) {
					return spark.error(error);
				}
				spark.insight = spark.insight || {};
				spark.insight[channel] = subscriptionId;
			},
			unsubscribe: function(channel, spark) {
				spark.insight = spark.insight || {};
				var subscriptionId = spark.insight[channel];
				if (subscriptionId) {
					try {
						app.services.insight.unsubscribe(subscriptionId);
					} catch (error) {
						app.error(error);
					}
				}
			},
		},
		'get-monero-transactions?': {
			subscribe: function(channel) {
				var params = querystring.parse(channel.split('?')[1]);
				async.whilst(
					function() { return hasSubscriptions(channel); },
					function(callback) {
						app.providers.monero.getTransactions(params.networkName, function(error, data) {
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

	var savePrimusClientLibraryToFile = function(filePath, cb) {
		try {
			var fs = require('fs');
			var mkdirp = require('mkdirp');
			var path = require('path');
			var UglifyJS = require('uglify-js');
			var code = primus.library();
			filePath = path.resolve(filePath);
			var result = UglifyJS.minify(code);
			if (result.error) {
				throw new Error(result.error);
			}
			var minified = result.code;
		} catch (error) {
			return cb(error);
		}
		async.series([
			function(next) {
				var dir = path.dirname(filePath);
				mkdirp(dir, next);
			},
			function(next) {
				fs.writeFile(filePath, minified, next);
			}
		], cb);
	};

	app.onStart(function(done) {
		if (!app.config.webRoot) return done();
		var path = require('path');
		var filePath = path.join(app.config.webRoot, 'primus', 'primus.js');
		savePrimusClientLibraryToFile(filePath, done);
	});

	return {
		broadcast: broadcast,
		savePrimusClientLibraryToFile: savePrimusClientLibraryToFile,
		primus: primus,
		subscriptions: subscriptions,
	};
};
