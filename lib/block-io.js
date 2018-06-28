'use strict';

var _ = require('underscore');
var BigNumber = require('bignumber.js');
var WebSocketClient = require('./ws-client');

var BlockIO = module.exports = function() {

	WebSocketClient.apply(this, arguments);
	_.bindAll(this, 'listenForWelcome', 'listenForNewTransactions');
	this.on('connect', this.listenForWelcome);
	this.on('welcome', this.listenForNewTransactions);
};

_.extend(BlockIO.prototype, WebSocketClient.prototype);

BlockIO.prototype.listenForWelcome = function() {
	var emit = _.bind(this.emit, this);
	var ws = this.ws;

	var onWelcome = _.once(function() {
		emit('welcome');
		ws.removeListener('message', listener);
	});

	var listener = function(data) {
		data = JSON.parse(data);
		if (data.status === 'success') {
			onWelcome();
		}
	};

	ws.on('message', listener);
};

BlockIO.prototype.listenForNewTransactions = function() {

	var emit = _.bind(this.emit, this);
	var ws = this.ws;
	var convertToSatoshis = this.convertToSatoshis;

	ws.on('message', function(data) {
		data = JSON.parse(data);
		if (data.type === 'new-transactions') {
			var network = data.data.network;
			_.each(data.data.outputs, function(output) {
				var amountInSatoshis = convertToSatoshis(output.amount);
				var tx = {
					address: output.address,
					amount: amountInSatoshis,
					txid: data.data.txid,
				};
				emit('tx:' + network, tx);
			});
		}
	});

	// Subscribe to new transactions.
	_.each(this.options.networks, function(network) {
		ws.send(JSON.stringify({ type: 'new-transactions', network: network }));
	});
};

BlockIO.prototype.convertToSatoshis = function(amount) {
	return (new BigNumber(amount)).multipliedBy(100000000).toNumber();
}