'use strict';

var _ = require('underscore');
var async = require('async');
var EventEmitter = require('events').EventEmitter || require('events');
var WebSocket = require('ws');

var WebSocketClient = module.exports = function(options) {

	this.options = options || {};
	this.connected = false;
	_.bindAll(this, 'connect', 'onConnect', 'onDisconnect');
};

// Provide event emitter methods.
_.extend(WebSocketClient.prototype, EventEmitter.prototype);

WebSocketClient.prototype.tryReconnect = function(done) {

	var test = _.bind(function() { return this.connected === true; }, this);
	var tryConnect = this.connect;
	var iteratee = function(next) {
		tryConnect(function(error) {
			_.delay(next, error ? 50 : 0);
		});
	};

	async.until(test, iteratee, done);
};

WebSocketClient.prototype.connect = function(done) {

	if (!this.options.url) {
		throw new Error('Cannot connect: Missing "url" option');
	}

	var ws = this.ws = new WebSocket(this.options.url);
	done = _.once(done || _.noop);
	ws.once('open', this.onConnect);
	ws.once('open', done);
	ws.once('error', done);
	ws.once('close', this.onDisconnect);
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

	// Remove all event listeners.
	this.removeAllListeners();

	// Close the websocket connection, if one exists.
	if (this.ws && this.connected) {
		this.ws.close(cb);
	} else {
		_.defer(cb);
	}
};
