'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var querystring = require('querystring');

var manager = require('../../../manager');
var app = manager.app();

describe('socket.channels', function() {

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

	describe('address-balance-updates', function() {

		var method = 'test-123';
		var provider;
		before(function() {
			provider = app.lib.BitcoinProvider(method)(app);
			app.providers[method] = provider;
		});

		after(function() {
			provider.close();
			provider = null;
			delete app.providers[method];
		});

		it('receive data', function(done) {

			var address = '1234567890xyz';
			var channel = 'address-balance-updates?' + querystring.stringify({
				method: method,
				address: address,
			});
			var value = 5000000;

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
					expect(receivedData.amount_received).to.equal(value);
				} catch (error) {
					return done(error);
				}

				done();
			});

			client.onError(done);
			client.subscribe(channel, function(error) {
				if (error) return done(error);
				var eventName = ['tx', address].join(':');
				var tx = {
					address: address,
					txid: '522f87xb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
					value: value,
				};
				provider.emit(eventName, tx);
			});
		});
	});
});
