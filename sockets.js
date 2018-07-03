'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var EventEmitter = require('events').EventEmitter || require('events');
	var Primus = require('primus');
	var querystring = require('querystring');
	var primus = new Primus(app.server, app.config.primus);

	// Global event bus.
	var emitter = new EventEmitter;

	// Set no limit on the number of event listeners.
	emitter.setMaxListeners(Infinity);

	var isValidChannel = function(channel) {

		return _.isString(channel);
	};

	primus.on('connection', function(spark) {

		app.log('[', spark.id, ']', 'socket.connection');

		spark.once('end', function() {
			app.log('[', spark.id, ']', 'socket.end');
			spark.removeAllListeners('data');
			spark.unsubscribeFromAllChannels();
		});

		spark.unsubscribeFromAllChannels = function() {
			_.each(spark.channelListeners, function(listener, channel) {
				emitter.removeListener(channel, listener);
			});
		};

		// Send an error to the socket client.
		spark.error = function(error) {

			app.log('[', spark.id, ']', 'socket.error', error);

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

		spark.on('data', function(dataFromSpark) {

			spark.channelListeners = spark.channelListeners || {};
			var action = dataFromSpark.action || null;
			var channel = dataFromSpark.channel || null;
			if (!action || !channel) return;
			var isMoneroTxs = channel.substr(0, 'get-monero-transactions?'.length) === 'get-monero-transactions?';
			switch (action) {

				case 'join':
					var listener = function(data) {
						spark.write({
							channel: channel,
							data: data,
						});
					};
					emitter.on(channel, listener);
					// If there is cached data for this channel, send it immediately.
					if (cache[channel]) {
						listener(cache[channel]);
					}
					app.log('[', spark.id, ']', 'channel.join', channel);
					spark.channelListeners[channel] = listener;
					if (isMoneroTxs) {
						startPollingMoneroTxs();
					}
					break;

				case 'leave':
					var listener = spark.channelListeners[channel] || null;
					if (listener) {
						emitter.removeListener(channel, listener);
						app.log('[', spark.id, ']', 'channel.leave', channel);
						delete spark.channelListeners[channel];
					}
					if (isMoneroTxs && !hasListeners(channel)) {
						stopPollingMoneroTxs();
					}
					break;
			}
		});
	});

	var hasListeners = function(channel) {
		return emitter.listeners(channel).length === 0;
	};

	var cache = {};

	_.each(['bitcoin', 'bitcoinTestnet', 'litecoin'], function(network) {

		var provider = app.providers[network];

		// New transactions for a given address and network.
		provider.on('tx', function(tx) {

			var channels = [
				'v1/new-txs?' + querystring.stringify({
					address: tx.address,
					network: network,
				}),
				// The second channel name has the parameters in the opposite order.
				'v1/new-txs?' + querystring.stringify({
					network: network,
					address: tx.address,
				}),
			];

			var data = {
				amount: tx.amount,
				txid: tx.txid,
			};

			_.each(channels, function(channel) {
				emitter.emit(channel, data);
			});
		});

		// Keep the following for temporary backwards compatibility.
		provider.on('tx', function(tx) {

			var channels = [
				'address-balance-updates?' + querystring.stringify({
					address: tx.address,
					method: network,
				}),
				// The second channel name has the parameters in the opposite order.
				'address-balance-updates?' + querystring.stringify({
					method: network,
					address: tx.address,
				}),
			];

			var data = { amount_received: tx.amount };

			_.each(channels, function(channel) {
				emitter.emit(channel, data);
			});
		});
	});

	var moneroPollingTimeout;

	var stopPollingMoneroTxs = function() {
		clearTimeout(moneroPollingTimeout);
		moneroPollingTimeout = null;
	};

	var startPollingMoneroTxs = function() {
		if (moneroPollingTimeout) return;
		(function getMoneroTxs() {
			async.each(['testnet', 'mainnet'], function(network, next) {
				app.providers.monero.getTransactions(network, function(error, data) {
					if (error) {
						app.error(error);
						return next();
					}
					var channel = 'get-monero-transactions?' + querystring.stringify({
						networkName: network,
					});
					cache[channel] = data;
					emitter.emit(channel, data);
					next();
				});
			}, function() {
				moneroPollingTimeout = _.delay(getMoneroTxs, app.config.moneroTxs.polling.frequency);
			});
		})();
	};

	var startPollingExchangeRates = function() {
		(function getExchangeRates() {
			app.providers.exchangeRates(function(error, data) {
				if (error) {
					app.error(error);
					return _.delay(getExchangeRates, app.config.exchangeRates.polling.retryDelayOnError);
				}
				var channel = 'exchange-rates';
				cache[channel] = data;
				emitter.emit(channel, data);
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
		cache: cache,
		primus: primus,
		savePrimusClientLibraryToFile: savePrimusClientLibraryToFile,
		startPollingExchangeRates: startPollingExchangeRates,
		startPollingMoneroTxs: startPollingMoneroTxs,
	};
};
