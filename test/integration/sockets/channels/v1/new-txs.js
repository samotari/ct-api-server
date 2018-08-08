'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var querystring = require('querystring');

var manager = require('../../../../manager');
var app = manager.app();

describe('socket.channel: v1/new-txs?address=ADDRESS&network=NETWORK', function() {

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

	describe('client subscribed to new transactions channel', function() {

		var address = '1234567890xyz';
		var channel = 'v1/new-txs?' + querystring.stringify({
			address: address,
			network: network,
		});
		var tx = {
			address: address,
			txid: '522f87xb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
			amount: 5000000,
		};

		beforeEach(function(done) {
			client.subscribe(channel, done);
		});

		it('client should receive new tx', function(done) {

			var receivedData;
			client.socket.on('data', function(data) {
				if (data && data.channel === channel) {
					receivedData = data.data;
				}
			});

			async.until(function() { return !!receivedData; }, function(next) {
				_.delay(next, 5);
			}, function() {
				try {
					expect(receivedData).to.be.an('object');
					expect(receivedData).to.deep.equal({
						amount: tx.amount,
						txid: tx.txid,
					});
				} catch (error) {
					return done(error);
				}
				done();
			});

			instance.emit('tx', tx);
		});

		describe('client disconnected before receiving tx', function() {

			beforeEach(function() {
				client.socket.destroy();
				client = null;
			});

			beforeEach(function() {
				instance.emit('tx', tx);
			});

			it('client should receive tx when reconnected', function(done) {

				// Create a new socket client and reconnect.
				client = manager.socketClient();
				client.socket.once('error', done);
				// Re-subscribe to the channel.
				client.subscribe(channel, function(error) {
					if (error) return done(error);
				});

				var receivedData;
				client.socket.on('data', function(data) {
					if (data && data.channel === channel) {
						receivedData = data.data;
					}
				});

				async.until(function() { return !!receivedData; }, function(next) {
					_.delay(next, 5);
				}, function() {
					try {
						expect(receivedData).to.be.an('object');
						expect(receivedData).to.deep.equal({
							amount: tx.amount,
							txid: tx.txid,
						});
					} catch (error) {
						return done(error);
					}
					done();
				});
			});
		});
	});
});
