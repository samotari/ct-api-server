'use strict';

var _ = require('underscore');
var bitcoin = require('bitcoinjs-lib');
var BigNumber = require('bignumber.js');
var EventEmitter = require('events').EventEmitter || require('events');
var request = require('request');
var zmq = require('zeromq');

var BitcoindZeroMQ = module.exports = function(options) {

	this.options = _.defaults({}, options || {
		network: 'bitcoin',
		statusPollInterval: 10 * 1000,
		statusPollTimeout: 4000,
	});

	this.closed = false;

	_.bindAll(this, 'onMessage');

	var sock = this.sock = zmq.socket('sub');

	if (this.options.dataUrl) {
		sock.connect(this.options.dataUrl);
		sock.subscribe('rawtx');
		sock.on('message', this.onMessage);
	}

	if (this.options.statusUrl) {
		this.initializeStatusCheck();
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
		var isReplaceable = this.txIsReplaceable(rawTx);

		_.each(outputs, function(output) {
			var txOutput = _.extend({},
				output,
				{
					isReplaceable: isReplaceable,
				}
			)
			this.emit('tx', txOutput);
		}, this);
	}
};

BitcoindZeroMQ.prototype.txIsReplaceable = function(rawTx) {

	var tx = this.decodeRawTx(rawTx);

	// The minimum value is 0 and the maximum value is (2^32 - 1)
	// Any value of sequence that is less than the maximum, can be replaced.
	var maxSequence = BigNumber('2').pow('32').minus('1');

	return _.some(tx.ins, function(input) {
		var sequence = new BigNumber(input.sequence);
		return sequence.lt(maxSequence);
	});
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

	clearTimeout(this.statusTimer);

	if (this.sock) {
		this.sock.close();
		this.sock = null;
	}

	this.closed = true;
};

BitcoindZeroMQ.prototype.initializeStatusCheck = function() {

	var initializeStatusCheck = _.bind(this.initializeStatusCheck, this);
	var uri = this.options.statusUrl;
	var onResponse = _.bind(function(error, response, data) {

		if (error) {
			console.error('Failed to connect to', uri, error);
		}

		if (!this.closed) {
			this.active = response && response.statusCode === 200;
			this.statusTimer = setTimeout(initializeStatusCheck, this.options.statusPollInterval);
		}

	}, this);

	request(uri, { timeout: this.options.statusPollTimeout }, onResponse);

};
