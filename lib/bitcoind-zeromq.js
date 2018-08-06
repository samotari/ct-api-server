'use strict';

var _ = require('underscore');
var bitcoin = require('bitcoinjs-lib');
var EventEmitter = require('events').EventEmitter || require('events');
var zmq = require('zeromq');

var BitcoindZeroMQ = module.exports = function(options) {

	this.options = _.defaults({}, options || {
		network: 'bitcoin',
	});

	_.bindAll(this, 'onMessage');

	var sock = this.sock = zmq.socket('sub');

	if (this.options.url) {
		sock.connect(this.options.url);
		sock.subscribe('rawtx');
		sock.on('message', this.onMessage);
	}
};

// Provide event emitter methods.
_.extend(BitcoindZeroMQ.prototype, EventEmitter.prototype);

// Network constants for bitcoinjs-lib.
BitcoindZeroMQ.prototype.networks = {
	bitcoin: bitcoin.networks.bitcoin,
	bitcoinTestnet: bitcoin.networks.testnet,
	litecoin: {
		bech32: 'ltc',
		pubKeyHash: 48,
		scriptHash: 50,
		wif: 128,
	},
};

BitcoindZeroMQ.prototype.onMessage = function(topic, message) {

	if (topic.toString() === 'rawtx') {
		var rawTx = message.toString('hex');
		var outputs = this.getOutputsFromRawTx(rawTx, this.options.network);
		_.each(outputs, function(output) {
			this.emit('tx', output);
		}, this);
	}
};

BitcoindZeroMQ.prototype.getOutputsFromRawTx = function(rawTx, network) {

	var tx = this.decodeRawTx(rawTx);
	if (!tx) return [];
	var txid = tx.getId();
	var network = this.networks[network || 'bitcoin'];

	return _.chain(tx.outs).map(function(out) {
		try {
			var address = bitcoin.address.fromOutputScript(out.script, network);
		} catch (error) {
			return null;
		}
		return {
			amount: out.value,
			address: address,
			txid: txid,
		};
	}).compact().value();
};

BitcoindZeroMQ.prototype.decodeRawTx = function(rawTx) {

	try {
		var tx = bitcoin.Transaction.fromHex(rawTx);
	} catch (error) {
		return null;
	}

	return tx;
};

BitcoindZeroMQ.prototype.close = function() {

	// Remove all event listeners.
	this.removeAllListeners();

	if (this.sock) {
		this.sock.close();
		this.sock = null;
	}
};
