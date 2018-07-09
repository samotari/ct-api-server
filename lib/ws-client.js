'use strict';

var _ = require('underscore');
var async = require('async');
var EventEmitter = require('events').EventEmitter || require('events');
var WebSocket = require('ws');

var WebSocketClient = module.exports = function(options) {

	this.options = _.defaults({}, options || {}, {
		reconnectDelay: 500,
	});
	this.connected = false;
	_.bindAll(this, 'connect', 'onConnect', 'onDisconnect');
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
	ws.once('open', function() {
		onConnect();
		ws.removeListener('close', done);
		ws.removeListener('error', done);
		ws.once('close', onDisconnect);
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

WebSocketClient.prototype.close = function(cb) {

	clearTimeout(this.tryReconnectTimeout);

	// Remove all event listeners.
	this.removeAllListeners();

	// Close the websocket connection, if one exists.
	if (this.ws && this.connected) {
		this.ws.close(cb);
	} else {
		_.defer(cb);
	}
};
