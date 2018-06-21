'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var EventEmitter = require('events').EventEmitter || require('events');

	var instances = _.mapObject(app.config.insight.hosts, function(configs, method) {
		return _.map(configs, function(config) {
			var instance = new app.lib.Insight(config);
			instance.method = method;
			return instance;
		});
	});

	app.onStart(function(done) {

		_.each(instances, function(instanceArray) {
			_.each(instanceArray, function(instance) {
				connectToInstance(instance, function() {
					instance.socket.on('tx', function(data) {
						var txs = reorganizeTxData(data);
						_.each(txs, function(tx) {
							var eventName = ['tx', instance.method].join(':');
							service.emit(eventName, tx);
						});
					});
					instance.socket.emit('subscribe', 'inv');
				});
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
				app.log('Disconnected from insight API (' + uri + ')');
			});
			done && done();
		});
	};

	var reorganizeTxData = function(txData) {
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
		return _.chain(txData.vout).map(function(vout) {
			var address = _.chain(vout).keys().first().value();
			if (!address) return null;
			return {
				address: address,
				txid: txData.txid,
				value: vout[address],
			};
		}).compact().value();
	};

	// Provide event emitter methods.
	var service = _.extend({
		connectToInstance: connectToInstance,
		instances: instances,
		reorganizeTxData: reorganizeTxData,
	}, EventEmitter.prototype);

	return service;
};
