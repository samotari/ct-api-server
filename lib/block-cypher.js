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

	_.bindAll(this,
		'subscribeToNewTxs'
	);

	this.on('connect', this.subscribeToNewTxs);
};

_.extend(BlockCypher.prototype, WebSocketClient.prototype);

BlockCypher.prototype.subscribeToNewTxs = function() {

	var ws = this.ws;
	var emit = _.bind(this.emit, this);

	// Listen for and handle incoming messages.
	ws.on('message', function(data) {

		try {
			data = JSON.parse(data);
		} catch (error) {
			console.error(error);
			return;
		}

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
