'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

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

	var channel = 'exchange-rates';

	describe(channel, function() {

		it('receive data', function(done) {

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

				var supportedDisplayCurrencies = _.chain(app.config.supportedDisplayCurrencies).clone().sortBy(_.identity).value();

				try {
					expect(receivedData).to.be.an('object');
					expect(receivedData['BTC']).to.equal('1.00000000');
					expect(_.keys(receivedData)).to.deep.equal(supportedDisplayCurrencies);
				} catch (error) {
					return done(error);
				}

				done();
			});

			client.subscribe('exchange-rates');
		});
	});
});
