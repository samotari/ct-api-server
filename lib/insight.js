'use strict';

var _ = require('underscore');
var SocketIOClient = require('socket.io-client');

var Insight = module.exports = function(config) {
	this.config = config;
	this.subscriptions = {};
	this.name = _.uniqueId('insight-api-');
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

	if (!channel || !_.isString(channel)) {
		throw new Error('Missing or invalid channel name');
	}

	if (!onData || !_.isFunction(onData)) {
		throw new Error('Missing or invalid on-data callback');
	}

	if (!this.socket) {
		throw new Error('Must call connect() before calling subscribe()');
	}

	// The channel name includes both a room name and event name.
	var channelParts = channel.split('/');
	var room = channelParts[0];
	var eventName = channelParts[1];

	// Subscribe to the channel's room only once.
	if (!this.hasSubscriptions(channel)) {
		this.socket.emit('subscribe', room);
	}

	// Add a listener to the socket for this on-data callback.
	this.socket.on(eventName, onData);

	// Create a unique subscription ID so that we can unsubscribe later.
	var subscriptionId = _.uniqueId(channel + '-');
	this.subscriptions[channel] = this.subscriptions[channel] || {};
	this.subscriptions[channel][subscriptionId] = onData;
	return subscriptionId;
};

Insight.prototype.unsubscribe = function(subscriptionId) {

	if (!subscriptionId || subscriptionId.indexOf('-') === -1) {
		throw new Error('Missing or invalid subscription ID');
	}

	var parts = subscriptionId.split('-');
	var channel = parts[0];

	if (!channel || !_.isString(channel)) {
		throw new Error('Missing or invalid channel name');
	}

	if (!this.socket) {
		throw new Error('Must call connect() before calling unsubscribe()');
	}

	var channelParts = channel.split('/');
	var room = channelParts[0];
	var eventName = channelParts[1];
	var onData = this.subscriptions[channel][subscriptionId];

	// Stop listening to the event for this on-data callback.
	this.socket.off(eventName, onData);

	// Clear the subscription ID / callback reference.
	this.subscriptions[channel] = this.subscriptions[channel] || {};
	delete this.subscriptions[channel][subscriptionId];

	// Only unsubscribe from the channel's room if there are no more listeners.
	if (!this.hasSubscriptions(room)) {
		this.socket.emit('unsubscribe', room);
	}
};

Insight.prototype.filterTxOutputsByAddress = function(txData, address) {
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

Insight.prototype.sumTxOutputs = function(outputs) {
	return _.chain(outputs).reduce(function(amount, memo) {
		return amount + memo;
	}, 0).value();
};

Insight.prototype.listenToAddress = function(address, onData) {
	var subscriptionId = this.subscribe('inv/tx', _.bind(function(data) {
		var outputs = this.filterTxOutputsByAddress(data, address);
		if (outputs.length > 0) {
			var tx = {
				amount_received: this.sumTxOutputs(outputs),
			};
			onData(tx);
		}
	}, this));
	return subscriptionId;
};
