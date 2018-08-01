'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var bitcoin = require('bitcoinjs-lib');
	var EventEmitter = require('events').EventEmitter || require('events');
	var zmq = require('zeromq');

	var service = _.extend({}, {
		instances: [],
	}, EventEmitter.prototype);

	// Network constants for bitcoinjs-lib.
	var networks = {
		bitcoin: bitcoin.networks.bitcoin,
		bitcoinTestnet: bitcoin.networks.testnet,
	};

	var BitcoindZeroMQ = function(options) {

		this.options = _.defaults({}, options || {
			network: 'bitcoin',
		});

		if (!this.options.url) {
			throw new Error('Missing required option: "url"');
		}

		if (!this.options.network) {
			throw new Error('Missing required option: "network"');
		}

		_.bindAll(this, 'onMessage');

		var sock = this.sock = zmq.socket('sub');
		sock.connect(options.url);
		sock.subscribe('rawtx');
		sock.on('message', this.onMessage);
		app.log('Subscriber connected to ' + options.url);
	};

	// Provide event emitter methods.
	_.extend(BitcoindZeroMQ.prototype, EventEmitter.prototype);

	BitcoindZeroMQ.prototype.onMessage = function(topic, message) {

		if (topic.toString() === 'rawtx') {
			var rawTx = message.toString('hex');
			var outputs = this.getOutputsFromRawTx(rawTx);
			_.each(outputs, function(output) {
				this.emit('tx', output);
			}, this);
		}
	};

	BitcoindZeroMQ.prototype.getOutputsFromRawTx = function(rawTx) {

		var tx = this.decodeRawTx(rawTx);
		var txid = tx.getId();
		var network = networks[this.options.network];

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

	BitcoindZeroMQ.prototype.decodeRawTx = function(rawtx) {

		try {
			var tx = bitcoin.Transaction.fromHex(rawtx);
		} catch (error) {
			app.log(error);
			return null;
		}

		return tx;
	};

	_.each(app.config.zeromq, function(socketUrls, network) {
		_.each(socketUrls, function(url) {
			var instance = new BitcoindZeroMQ({
				network: network,
				url: url,
			});
			instance.on('tx', function(tx) {
				tx = _.pick(tx, 'address', 'amount', 'txid');
				service.emit('tx:' + network, tx);
			});
			service.instances.push(instance);
		});
	});

	return service;
};
