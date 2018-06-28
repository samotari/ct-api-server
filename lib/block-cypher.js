'use strict';

/*
	https://www.blockcypher.com/dev/bitcoin/?javascript#using-websockets
*/

var _ = require('underscore');
var WebSocketClient = require('./ws-client');

var BlockCypher = module.exports = function() {

	WebSocketClient.apply(this, arguments);
	_.bindAll(this, 'listenForNewUnconfirmedTransactions');
	this.on('connect', this.listenForNewUnconfirmedTransactions);
};

_.extend(BlockCypher.prototype, WebSocketClient.prototype);

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
