'use strict';

/*
	https://www.blockcypher.com/dev/bitcoin/?javascript#using-websockets
*/

var _ = require('underscore');
var async = require('async');
var EventEmitter = require('events').EventEmitter || require('events');
var WebSocket = require('ws');

var BlockCypher = module.exports = function(options) {

	this.options = options || {};
	this.connected = false;
	_.bindAll(this, 'connect', 'onConnect', 'onDisconnect');
};

// Provide event emitter methods.
_.extend(BlockCypher.prototype, EventEmitter.prototype);

BlockCypher.prototype.tryReconnect = function(done) {

	var test = _.bind(function() { return this.connected === true; }, this);
	var tryConnect = this.connect;
	var iteratee = function(next) {
		tryConnect(function(error) {
			_.delay(next, error ? 50 : 0);
		});
	};

	async.until(test, iteratee, done);
};

BlockCypher.prototype.connect = function(done) {

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

BlockCypher.prototype.onDisconnect = function() {

	this.connected = false;
	this.tryReconnect();
	this.emit('disconnect');
};

BlockCypher.prototype.onConnect = function() {

	this.connected = true;
	this.listenForNewUnconfirmedTransactions();
	this.emit('connect');
};

BlockCypher.prototype.listenForNewUnconfirmedTransactions = function() {

	var emit = _.bind(this.emit, this);
	var ws = this.ws;

	// Listen for and handle incoming messages.
	ws.on('message', function(data) {
		data = JSON.parse(data);
		_.each(data.outputs, function(output) {
			if (!_.isEmpty(output.addresses)) {
				_.each(output.addresses, function(address) {
					var tx = {
						address: address,
						amount: output.value,
						txid: data.hash,
					};
					emit('tx', tx);
				});
			}
		});
	});

	// Subscribe to new, unconfirmed transactions.
	ws.send(JSON.stringify({ event: 'unconfirmed-tx' }));
};

BlockCypher.prototype.close = function(cb) {

	// Remove all event listeners.
	this.removeAllListeners();

	// Close the websocket connection, if one exists.
	if (this.ws && this.connected) {
		this.ws.close(cb);
	} else {
		_.defer(cb);
	}
};
