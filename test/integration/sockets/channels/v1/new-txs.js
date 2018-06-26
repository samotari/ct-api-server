'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var querystring = require('querystring');

var manager = require('../../../../manager');
var app = manager.app();

describe('socket.channel: v1/new-txs?network=NETWORK&address=ADDRESS', function() {

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
	before(function() {
		instance = app.services.blockCypher.addInstance({}, network);
	});

	after(function(done) {
		instance.close(done);
	});

	it('receive data', function(done) {

		var address = '1234567890xyz';
		var channel = 'v1/new-txs?' + querystring.stringify({
			network: network,
			address: address,
		});

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
				expect(receivedData).to.deep.equal({
					amount: tx.amount,
					txid: tx.txid,
				});
			} catch (error) {
				return done(error);
			}

			done();
		});

		client.onError(done);

		var tx;
		client.subscribe(channel, function(error) {
			if (error) return done(error);
			tx = {
				address: address,
				txid: '522f87xb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
				amount: 5000000,
			};
			instance.emit('tx', tx);
		});
	});
});
