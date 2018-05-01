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

		var io;
		var port = 4001;
		before(function() {
			io = require('socket.io')();
			io.listen(port);
		});

		after(function(done) {
			io.close(done);
		});

		var method = 'test';
		var instance;
		before(function(done) {
			instance = new app.lib.Insight({
				baseUrl: 'http://localhost:' + port,
			});
			instance.connect(done);
			app.services.insight.instances[method] = [instance];
		});

		after(function() {
			delete app.services.insight.instances[method];
		});

		it('receive data', function(done) {

			var channel = 'address-balance-updates?' + querystring.stringify({
				method: method,
				address: '1234567890',
			});

			var receivedData;
			client.socket.on('data', function(data) {
				if (data && data.channel === channel) {
					receivedData = data.data;
				}
			});

			var amount = 50000000;

			// Get the only connected socket.
			var socket = _.values(io.sockets.sockets)[0];
			// Listen to when the socket joins the "inv/tx" room.
			socket.join('inv/tx', function() {
				// Emit transaction data until the client receives the data.
				async.until(function() { return !!receivedData; }, function(next) {
					socket.emit('tx', {
						txid: '7fb51b6410eb4efeb447bfeb92e62cff6f33e3cc66a5b9dfe3d05b308c062a75',
						valueOut: 4.5,
						vout: [
							{ '1234567890': amount },
							{ '2MxPRHPXLeiTdHT5ciu6LSDixffx7Su7cbL': 400000000 }
						],
						isRBF: false
					});
					_.delay(next, 5);
				}, _.noop);
			});

			async.until(function() { return !!receivedData; }, function(next) {
				_.delay(next, 10);
			}, function(error) {

				if (error) {
					return done(error);
				}

				try {
					expect(receivedData).to.be.an('object');
					expect(receivedData.amount_received).to.equal(amount);
				} catch (error) {
					return done(error);
				}

				done();
			});

			client.onError(done);
			client.subscribe(channel);
		});
	});
});
