'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var querystring = require('querystring');

var manager = require('../../../manager');
var app = manager.app();

describe('socket.channel: address-balance-updates?address=ADDRESS&method=NETWORK', function() {

	var client;
	beforeEach(function(done) {
		client = manager.socketClient();
		client.socket.once('open', function() {
			done();
		});
	});

	afterEach(function() {
		if (client) {
			client.socket.destroy();
			client = null;
		}
	});

	var network = 'bitcoin';
	var instance;
	var service = app.services.bitcoindZeroMQ;
	before(function() {
		instance = new app.lib.BitcoindZeroMQ({
			network: network,
		});
		instance.on('tx', function(tx) {
			tx = _.pick(tx, 'address', 'amount', 'txid');
			service.emit('tx:' + network, tx);
		});
		service.instances.push(instance);
	});

	after(function() {
		instance.close();
	});

	it('receive data', function(done) {

		var address = '1234567890xyzz';
		var channel = 'address-balance-updates?' + querystring.stringify({
			address: address,
			method: network,
		});
		var amount = 5000000;

		var receivedData;
		client.socket.on('data', function(data) {
			if (data && data.channel === channel) {
				receivedData = data.data;
			}
		});

		async.until(function() { return !!receivedData; }, function(next) {
			_.delay(next, 10);
		}, function(error) {

			try {
				expect(error).to.equal(null);
				expect(receivedData).to.be.an('object');
				expect(receivedData.amount_received).to.equal(amount);
			} catch (error) {
				return done(error);
			}

			done();
		});

		client.onError(done);
		client.subscribe(channel, function(error) {
			if (error) return done(error);
			var tx = {
				address: address,
				txid: '522f87xb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
				amount: amount,
			};
			instance.emit('tx', tx);
		});
	});
});
