'use strict';

/*
	https://www.blockcypher.com/dev/bitcoin/?javascript#using-websockets
*/

var _ = require('underscore');
var WebSocketClient = require('./ws-client');

var BlockCypher = module.exports = function(options) {

	options = _.defaults({}, options || {}, {
		pingInterval: 20000,
	});

	WebSocketClient.apply(this, [options]);
	_.bindAll(this, 'listenForNewUnconfirmedTransactions', 'ping', 'startPinging', 'stopPinging');
	this.on('connect', this.listenForNewUnconfirmedTransactions);
	this.on('connect', this.startPinging);
	this.on('disconnect', this.stopPinging);
};

_.extend(BlockCypher.prototype, WebSocketClient.prototype);

BlockCypher.prototype.ping = function() {

	var ws = this.ws;

	if (ws) {
		ws.send(JSON.stringify({ 'event': 'ping' }));
	}
};

BlockCypher.prototype.startPinging = function() {

	this.pingInterval = setInterval(this.ping, this.options.pingInterval);
};

BlockCypher.prototype.stopPinging = function() {

	clearInterval(this.pingInterval);
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

BlockCypher.prototype.close = function() {

	this.stopPinging();
	WebSocketClient.prototype.close.apply(this, arguments);
};
