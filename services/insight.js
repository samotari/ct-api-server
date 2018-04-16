'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var SocketIOClient = require('socket.io-client');

	var Insight = function(config) {
		this.config = config;
		this.subscriptions = {};
		this.name = _.uniqueId('insight-api');
	};

	Insight.prototype.connect = function(cb) {
		var done = cb && _.once(cb) || _.noop;
		this.socket = SocketIOClient(this.config.baseUrl);
		this.socket.once('connect', function() {
			done();
		});
		this.socket.once('error', function(error) {
			done(error)
		});
	};

	Insight.prototype.hasSubscriptions = function(channel) {
		return _.values(this.subscriptions[channel]).length > 0;
	};

	Insight.prototype.subscribe = function(channel, onData) {
		if (!channel || !this.socket) return;
		var channelParts = channel.split('/');
		var room = channelParts[0];
		var eventName = channelParts[1];
		if (!this.hasSubscriptions(channel)) {
			this.socket.emit('subscribe', room);
		}
		this.socket.on(eventName, onData);
		var subscriptionId = _.uniqueId(this.method + ':' + this.name + '-subscriptions:' + channel + ':');
		this.subscriptions[channel] = this.subscriptions[channel] || {};
		this.subscriptions[channel][subscriptionId] = onData;
		return subscriptionId;
	};

	Insight.prototype.unsubscribe = function(subscriptionId) {
		if (!subscriptionId || subscriptionId.indexOf(':') === -1) return;
		var parts = subscriptionId.split(':');
		var channel = parts[2];
		if (!channel || !this.socket) return;
		var channelParts = channel.split('/');
		var room = channelParts[0];
		var eventName = channelParts[1];
		var onData = this.subscriptions[channel][subscriptionId];
		this.socket.off(eventName, onData);
		this.subscriptions[channel] = this.subscriptions[channel] || {};
		delete this.subscriptions[channel][subscriptionId];
		if (!this.hasSubscriptions(room)) {
			this.socket.emit('unsubscribe', room);
		}
	};

	var instances = _.mapObject(app.config.insight, function(config, method) {
		var instance = new Insight(config);
		instance.method = method;
		return instance;
	});

	app.onStart(function(done) {
		async.each(instances, function(instance, next) {
			instance.connect(function(error) {
				if (error) {
					app.error('Failed to connect to insight API (' + instance.method + ')', error);
				} else {
					app.log('Connected to insight API (' + instance.method + ')');
				}
			});
			next();
		}, done);
	});

	var getInstance = function(method) {
		return instances[method];
	};

	var filterTxOutputsByAddress = function(txData, address) {
		/*
			{
				txid: '<TRANSACTION ID>',
				valueOut: 4.5,
				vout: [
					{ '<SOME ADDRESS>': 50000000 },
					{ '<ANOTHER ADDRESS': 400000000 }
				],
				isRBF: false
			}
		*/
		return Array.prototype.concat.apply([], _.chain(txData.vout).filter(function(vout) {
			return !!vout[address];
		}).map(function(vout) {
			return _.values(vout);
		}).value());
	};

	var sumTxOutputs = function(outputs) {
		return _.chain(outputs).reduce(function(amount, memo) {
			return amount + memo;
		}, 0).value();
	};

	return {
		instances: instances,
		filterTxOutputsByAddress: filterTxOutputsByAddress,
		sumTxOutputs: sumTxOutputs,
		listenToAddress: function(method, address, onData) {
			var instance = getInstance(method);
			var subscriptionId = instance.subscribe('inv/tx', function(data) {
				var outputs = filterTxOutputsByAddress(data, address);
				if (outputs.length > 0) {
					var tx = {
						amount_received: sumTxOutputs(outputs),
					};
					onData(tx);
				}
			});
			return subscriptionId;
		},
		unsubscribe: function(subscriptionId) {
			if (!subscriptionId) return;
			var method = subscriptionId.split(':')[0];
			var instance = getInstance(method);
			instance.unsubscribe(subscriptionId);
		},
	};
};



