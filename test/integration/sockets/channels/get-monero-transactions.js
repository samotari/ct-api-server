'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../../manager');
var app = manager.app();

describe('socket.channel get-monero-transactions', function() {

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

	var channel = 'get-monero-transactions?networkName=testnet';

	describe(channel, function() {

		it('receive right data format', function(done) {

			var receivedData;
			client.socket.on('data', function(data) {
				if (data && data.channel === channel) {
					receivedData = data.data;
				}
			});

			async.until(function() { return !!receivedData; }, function(next) {
				_.delay(next, 10);
			}, function(error) {

				if (error) {
					return done(error);
				}

				try {
					expect(receivedData).to.be.an('array');
					if (!_.isEmpty(receivedData)) {
						expect(receivedData[0]).to.have.property('coinbase');
						expect(receivedData[0]).to.have.property('extra');
						expect(receivedData[0]).to.have.property('mixin');
						expect(receivedData[0]).to.have.property('payment_id');
						expect(receivedData[0]).to.have.property('payment_id8');
						expect(receivedData[0]).to.have.property('rct_type');
						expect(receivedData[0]).to.have.property('tx_fee');
						expect(receivedData[0]).to.have.property('tx_hash');
						expect(receivedData[0]).to.have.property('tx_size');
						expect(receivedData[0]).to.have.property('tx_version');
						expect(receivedData[0]).to.have.property('xmr_inputs');
						expect(receivedData[0]).to.have.property('xmr_outputs');
					}
				} catch (error) {
					return done(error);
				}

				done();
			});

			client.subscribe(channel);
		});
	});
});
