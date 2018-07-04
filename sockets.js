'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var Primus = require('primus');
	var querystring = require('querystring');
	var primus = new Primus(app.server, app.config.primus);

	// Channel hash containing the spark ID of clients in each channel.
	var channels = {};
	var broadcastToChannel = function(channel, data) {
		_.each(channels[channel] || {}, function(value, id) {
			var spark = primus.spark(id);
			spark.writeChannelData(channel, data);
		});
	};
	var channelHasParticipants = function(channel) {
		return _.some(channels[channel] || {}, function() {
			return true;
		});
	};

	// Add channel functionality to primus.
	primus.plugin('channels', {
		server: function(primus) {
			var Spark = primus.Spark;
			Spark.prototype.writeChannelData = function(channel, data) {
				this.write({
					channel: channel,
					data: data,
				});
			};
			Spark.prototype.join = function(channel) {
				channels[channel] = channels[channel] || {};
				channels[channel][this.id] = true;
				this.channels = this.channels || {};
				this.channels[channel] = true;
				// If there is cached data for this channel, send it immediately to this spark.
				if (cache[channel]) {
					this.writeChannelData(channel, cache[channel]);
				}
				app.log('[' + this.id + ']', 'channel.join', channel);
				var isMoneroTxs = channel.substr(0, 'get-monero-transactions?'.length) === 'get-monero-transactions?';
				if (isMoneroTxs) {
					startPollingMoneroTxs();
				}
			};
			Spark.prototype.leave = function(channel) {
				channels[channel] = channels[channel] || {};
				channels[channel][this.id] = null;
				this.channels = this.channels || {};
				this.channels[channel] = null;
				app.log('[' + this.id + ']', 'channel.leave', channel);
				var isMoneroTxs = channel.substr(0, 'get-monero-transactions?'.length) === 'get-monero-transactions?';
				if (isMoneroTxs && !channelHasParticipants(channel)) {
					stopPollingMoneroTxs();
				}
			};
			Spark.prototype.isInChannel = function(channel) {
				return this.channels[channel] === true;
			};
			Spark.prototype.cleanUpChannels = function(channel) {
				this.channels = _.chain(this.channels).map(function(value, channel) {
					return !_.isNull(value) ? [channel, true]: null;
				}).compact().object().value();
			};
			Spark.prototype.leaveAllChannels = function() {
				_.each(this.channels, function(value, channel) {
					if (!_.isNull(value)) {
						this.leave(channel);
					}
				}, this);
				this.cleanUpChannels();
			};
		}
	});

	// More custom functionality for primus.
	primus.plugin('custom', {
		server: function(primus) {
			var Spark = primus.Spark;
			Spark.prototype.error = function(error) {
				app.log('[' + this.id + ']', 'socket.error', error);
				if (_.isObject(error) && error.message) {
					error = error.message;
				}
				// Only send error strings to the client.
				if (_.isString(error)) {
					this.write({
						error: error,
					});
				}
			};
		}
	});

	// Periodically clean-up the channels object.
	setInterval(function() {
		channels = _.chain(channels).map(function(idsHash, channel) {
			idsHash = _.chain(idsHash).map(function(value, id) {
				return !_.isNull(value) ? [id, true]: null;
			}).compact().object().value();
			return !_.isEmpty(idsHash) ? [channel, idsHash] : null;
		}).compact().object().value();
	}, 30000);

	primus.on('connection', function(spark) {

		app.log('[' + spark.id + ']', 'socket.connection');

		spark.once('end', function() {
			app.log('[' + spark.id + ']', 'socket.end');
			spark.removeAllListeners('data');
			spark.leaveAllChannels();
		});

		spark.on('data', function(dataFromSpark) {

			var action = dataFromSpark.action || null;
			var channel = dataFromSpark.channel || null;
			if (!action || !channel) return;

			switch (action) {

				case 'join':
					spark.join(channel);
					break;

				case 'leave':
					spark.leave(channel);
					break;

				default:
					app.log('[' + spark.id + ']', 'unknown action', action);
					break;
			}
		});
	});

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
				broadcastToChannel(channel, data);
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
				broadcastToChannel(channel, data);
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
					broadcastToChannel(channel, data);
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
				broadcastToChannel(channel, data);
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
		broadcastToChannel: broadcastToChannel,
		cache: cache,
		channelHasParticipants: channelHasParticipants,
		channels: channels,
		primus: primus,
		savePrimusClientLibraryToFile: savePrimusClientLibraryToFile,
		startPollingExchangeRates: startPollingExchangeRates,
		startPollingMoneroTxs: startPollingMoneroTxs,
	};
};
