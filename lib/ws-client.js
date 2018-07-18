'use strict';

var _ = require('underscore');
var async = require('async');
var EventEmitter = require('events').EventEmitter || require('events');
var moment = require('moment');
var WebSocket = require('ws');

var WebSocketClient = module.exports = function(options) {

	this.options = _.defaults({}, options || {}, {
		debug: false,
		logLastReceivedInterval: 5 * 60 * 1000,
		pingInterval: false,
		reconnectDelay: 500,
		url: null,
	});

	this.connected = false;

	_.bindAll(this,
		'connect',
		'onConnect',
		'onDisconnect',
		'ping',
		'startPinging',
		'stopPinging',
		'writeLastReceivedTimeToLog',
		'updateLastReceivedTime'
	);

	if (this.options.pingInterval) {
		this.on('connect', this.startPinging);
		this.on('disconnect', this.stopPinging);
	}

	this.updateLastReceivedTime = _.throttle(this.updateLastReceivedTime, 500, { leading: false });
	this.lastReceivedTime = null;
	setInterval(this.writeLastReceivedTimeToLog, this.options.logLastReceivedInterval);
};

// Provide event emitter methods.
_.extend(WebSocketClient.prototype, EventEmitter.prototype);

WebSocketClient.prototype.tryReconnect = function(done) {

	var test = _.bind(function() { return this.connected === true; }, this);
	var tryConnect = this.connect;
	var delay = this.options.reconnectDelay;
	var iteratee = _.bind(function(next) {
		tryConnect(_.bind(function(error) {
			this.tryReconnectTimeout = _.delay(next, delay);
		}, this));
	}, this);

	async.until(test, iteratee, done);
};

WebSocketClient.prototype.connect = function(done) {

	if (!this.options.url) {
		throw new Error('Cannot connect: Missing "url" option');
	}

	var ws = this.ws = new WebSocket(this.options.url);
	done = _.once(done || _.noop);
	var onConnect = _.bind(this.onConnect, this);
	var onDisconnect = _.bind(this.onDisconnect, this);
	var updateLastReceivedTime = _.bind(this.updateLastReceivedTime, this);
	ws.once('open', function() {
		onConnect();
		ws.removeListener('close', done);
		ws.removeListener('error', done);
		ws.once('close', onDisconnect);
		ws.on('message', updateLastReceivedTime);
		done();
	});
	ws.once('close', done);
	ws.once('error', done);
};

WebSocketClient.prototype.onDisconnect = function() {

	this.connected = false;
	this.tryReconnect();
	this.emit('disconnect');
};

WebSocketClient.prototype.onConnect = function() {

	this.connected = true;
	this.emit('connect');
};

WebSocketClient.prototype.ping = function() {

	var ws = this.ws;

	if (ws) {
		ws.send(JSON.stringify({ 'event': 'ping' }));
	}
};

WebSocketClient.prototype.startPinging = function() {

	this.pingInterval = setInterval(this.ping, this.options.pingInterval);
};

WebSocketClient.prototype.stopPinging = function() {

	clearInterval(this.pingInterval);
};

WebSocketClient.prototype.updateLastReceivedTime = function() {

	this.lastReceivedTime = Date.now();
};

WebSocketClient.prototype.writeLastReceivedTimeToLog = function() {

	var datetime = (this.lastReceivedTime && moment(this.lastReceivedTime).format('YYYY-MM-DD HH:mm:ss')) || 'NEVER';
	this.log('[' + this.options.url + ']', 'Last received', datetime);
};

WebSocketClient.prototype.log = function() {

	if (this.options.debug) {
		console.log.apply(console, arguments);
	}
};

WebSocketClient.prototype.close = function(cb) {

	clearTimeout(this.tryReconnectTimeout);

	// Remove all event listeners.
	this.removeAllListeners();

	// Stop sending pings.
	this.stopPinging();

	// Close the websocket connection, if one exists.
	if (this.ws && this.connected) {
		this.ws.close(cb);
	} else {
		_.defer(cb);
	}
};
