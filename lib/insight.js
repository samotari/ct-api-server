'use strict';

var _ = require('underscore');
var EventEmitter = require('events').EventEmitter || require('events');
var moment = require('moment');
var SocketIOClient = require('socket.io-client');

var Insight = module.exports = function(options) {

	this.options = _.defaults({}, options, {
		debug: false,
		logLastReceivedInterval: 5 * 60 * 1000,
		url: null,
	});

	this.connected = false;

	_.bindAll(this,
		'connect',
		'onConnect',
		'onDisconnect',
		'writeLastReceivedTimeToLog',
		'updateLastReceivedTime'
	);

	this.updateLastReceivedTime = _.throttle(this.updateLastReceivedTime, 500, { leading: false });
	this.lastReceivedTime = null;
	setInterval(this.writeLastReceivedTimeToLog, this.options.logLastReceivedInterval);
};

// Provide event emitter methods.
_.extend(Insight.prototype, EventEmitter.prototype);

Insight.prototype.connect = function(done) {

	var socket = this.socket = SocketIOClient(this.options.url);
	done = _.once(done || _.noop);
	socket.once('connect', this.onConnect);
	socket.once('connect', done);
	socket.once('error', done);
	socket.once('disconnect', this.onDisconnect);
};

Insight.prototype.onDisconnect = function() {

	this.connected = false;
	this.emit('disconnect');
};

Insight.prototype.onConnect = function() {

	this.connected = true;
	this.subscribeToNewTxs();
	this.emit('connect');
};

Insight.prototype.subscribeToNewTxs = function() {

	var emit = _.bind(this.emit, this);
	var reorganizeTxData = _.bind(this.reorganizeTxData, this);
	var updateLastReceivedTime = _.bind(this.updateLastReceivedTime, this);

	this.socket.on('tx', function(data) {
		updateLastReceivedTime();
		var txs = reorganizeTxData(data);
		_.each(txs, function(tx) {
			emit('tx', tx);
		});
	});

	this.socket.emit('subscribe', 'inv');
};

Insight.prototype.reorganizeTxData = function(txData) {
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
			amount: vout[address],
			txid: txData.txid,
		};
	}).compact().value();
};

Insight.prototype.updateLastReceivedTime = function() {

	this.lastReceivedTime = Date.now();
};

Insight.prototype.writeLastReceivedTimeToLog = function() {

	var datetime = (this.lastReceivedTime && moment(this.lastReceivedTime).format('YYYY-MM-DD HH:mm:ss')) || 'NEVER';
	this.log('[' + this.options.url + ']', 'Last received', datetime);
};

Insight.prototype.log = function() {

	if (this.options.debug) {
		console.log.apply(console, arguments);
	}
};

Insight.prototype.close = function(cb) {

	// Remove all event listeners.
	this.removeAllListeners();

	// Close the websocket connection, if one exists.
	if (this.socket && this.socket.connected) {
		this.socket.close();
		this.socket = null;
	}

	_.defer(cb);
};
