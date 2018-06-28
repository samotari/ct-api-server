'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var Primus = require('primus');
	var querystring = require('querystring');
	var primus = new Primus(app.server, app.config.primus);
	var subscriptions = {};

	primus.on('connection', function(spark) {

		spark.once('end', function() {
			spark.removeAllListeners('data');
			unsubscribeFromAll(spark);
		});

		// Send an error to the socket client.
		spark.error = function(error) {
			app.log(error);
			if (_.isObject(error) && error.message) {
				error = error.message;
			}
			// Only send error strings to the client.
			if (_.isString(error)) {
				spark.write({
					error: error,
				});
			}
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
		/*
			Subscribe to new transactions for a given address and network.
		*/
		'v1/new-txs?': {
			subscribe: function(channel, spark) {
				var params = querystring.parse(channel.split('?')[1]);
				var network = params.network;
				var provider = app.providers[network];
				if (provider) {
					var address = params.address;
					var eventName = ['tx', address].join(':');
					var listener = function(tx) {
						var data = {
							amount: tx.amount,
							txid: tx.txid,
						};
						broadcast(channel, data);
					};
					provider.on(eventName, listener);
					spark.listeners = spark.listeners || {};
					spark.listeners[channel] = listener;
				}
			},
			unsubscribe: function(channel, spark) {
				spark.listeners = spark.listeners || {};
				var listener = spark.listeners[channel];
				if (listener) {
					var params = querystring.parse(channel.split('?')[1]);
					var network = params.network;
					var provider = app.providers[network];
					if (provider) {
						var address = params.address;
						var eventName = ['tx', address].join(':');
						provider.removeListener(eventName, listener);
					}
				}
				delete spark.listeners[channel];
			},
		},
		// Keep the following handler for temporary backwards compatibility.
		'address-balance-updates?': {
			subscribe: function(channel, spark) {
				spark.listeners = spark.listeners || {};
				spark.listeners[channel] = spark.listeners[channel] || {};
				var params = querystring.parse(channel.split('?')[1]);
				var method = params.method;
				var address = params.address;
				var eventName = ['tx', address].join(':');
				var listener = function(tx) {
					var data = { amount_received: tx.amount };
					broadcast(channel, data);
				};
				app.providers[method].on(eventName, listener);
				spark.listeners[channel] = listener;
			},
			unsubscribe: function(channel, spark) {
				spark.listeners = spark.listeners || {};
				var params = querystring.parse(channel.split('?')[1]);
				var method = params.method;
				var address = params.address;
				var eventName = ['tx', address].join(':');
				var listener = spark.listeners[channel];
				if (listener) {
					app.providers[method].removeListener(eventName, listener);
				}
				delete spark.listeners[channel];
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
		app.log('socket.subscribe', spark.id, channel);
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
		app.log('socket.unsubscribe', spark.id, channel);
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

	var startPollingExchangeRates = function() {
		(function getExchangeRates() {
			app.providers.exchangeRates(function(error, rates) {
				if (error) {
					app.log('Failed to get exchange rates data', error);
					return _.delay(getExchangeRates, app.config.exchangeRates.polling.retryDelayOnError);
				}
				var channel = 'exchange-rates';
				cache[channel] = rates;
				broadcast(channel, rates);
				_.delay(getExchangeRates, app.config.exchangeRates.polling.frequency);
			});
		})();
	};

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

	app.onStart(function(done) {
		if (app.config.exchangeRates.polling.init === true) {
			startPollingExchangeRates();
		}
		done();
	});

	return {
		broadcast: broadcast,
		cache: cache,
		primus: primus,
		savePrimusClientLibraryToFile: savePrimusClientLibraryToFile,
		startPollingExchangeRates: startPollingExchangeRates,
		subscriptions: subscriptions,
	};
};
