'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('lib.insight', function() {

	var io;
	var port = 4001;
	beforeEach(function() {
		io = require('socket.io')();
		io.listen(port);
	});

	var instance;
	beforeEach(function(done) {
		instance = new app.lib.Insight({
			baseUrl: 'http://localhost:' + port,
		});
		instance.connect(done);
	});

	afterEach(function() {
		instance.socket.close();
	});

	afterEach(function(done) {
		io.close(done);
	});

	describe('reconnect', function() {

		it('should automatically reconnect when the socket.io server disconnects', function(done) {
			instance.socket.on('reconnect', function() {
				async.until(function() {
					return instance.socket.connected;
				}, function(next) {
					_.delay(next, 10);
				}, done);
			});
			io.close();
			io = require('socket.io')();
			io.listen(port);
		});
	});

	describe('Insight#hasSubscriptions(channel)', function() {

		it('with no subscriptions', function() {
			var channel = 'none';
			expect(instance.hasSubscriptions(channel)).to.equal(false);
		});

		it('with subscriptions', function() {
			var channel = 'some';
			instance.subscribe(channel, _.noop);
			expect(instance.hasSubscriptions(channel)).to.equal(true);
		});
	});

	describe('Insight#subscribe(channel, onData)', function() {

		var room = '99';
		var eventName = 'someEvent';
		var channel;
		before(function() {
			channel = [room, eventName].join(instance.delimiters.channel);
		});

		it('missing channel name', function() {
			var thrownError;
			try {
				instance.subscribe();
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Missing or invalid channel name');
		});

		it('missing on-data callback', function() {
			var thrownError;
			try {
				instance.subscribe(channel);
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Missing or invalid on-data callback');
		});

		it('did not call connect()', function() {
			var someInstance = new app.lib.Insight();
			var thrownError;
			try {
				someInstance.subscribe(channel, function() {});
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Must call connect() before calling subscribe()');
		});

		it('should subscribe to the given channel', function(done) {
			var onData = function() {};
			// Get the only connected socket.
			var socket = _.values(io.sockets.sockets)[0];
			// Listen to when the socket joins the "inv/tx" room.
			socket.once('subscribe', function(toRoom) {
				expect(toRoom).to.equal(room);
				done();
			});
			var subscriptionId = instance.subscribe(channel, onData);
			expect(subscriptionId).to.be.a('string');
			expect(instance.subscriptions[channel]).to.not.be.undefined;
			expect(instance.subscriptions[channel][subscriptionId]).to.equal(onData);
		});
	});

	describe('Insight#unsubscribe(subscriptionId)', function() {

		var room = '77';
		var eventName = 'someEvent2';

		var channel;
		before(function() {
			channel = [room, eventName].join(instance.delimiters.channel);
		});

		var subscriptionId;
		beforeEach(function() {
			subscriptionId = instance.subscribe(channel, function() {});
		});

		it('missing subscription ID', function() {
			var thrownError;
			try {
				instance.unsubscribe();
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Missing or invalid subscription ID');
		});

		it('missing channel name', function() {
			var thrownError;
			try {
				instance.unsubscribe(instance.delimiters.subscriptionId + '123');
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Missing or invalid channel name');
		});

		it('did not call connect()', function() {
			var someInstance = new app.lib.Insight();
			var thrownError;
			try {
				someInstance.unsubscribe(subscriptionId);
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Must call connect() before calling unsubscribe()');
		});

		it('should unsubscribe from the given channel', function(done) {
			// Get the only connected socket.
			var socket = _.values(io.sockets.sockets)[0];
			// Listen to when the socket joins the "inv/tx" room.
			socket.once('unsubscribe', function(toRoom) {
				expect(toRoom).to.equal(room);
				done();
			});
			instance.unsubscribe(subscriptionId);
			expect(instance.subscriptions[channel]).to.not.be.undefined;
			expect(instance.subscriptions[channel][subscriptionId]).to.be.undefined;
		});

		it('with multiple subscriptions', function(done) {
			var subscriptionId2 = instance.subscribe(channel, function() {});
			var subscriptionId3 = instance.subscribe(channel, function() {});
			// Get the only connected socket.
			var socket = _.values(io.sockets.sockets)[0];
			var emittedEvent = false;
			socket.once('unsubscribe', function() {
				emittedEvent = true;
			});
			setTimeout(function() {
				expect(emittedEvent).to.equal(false);
				done();
			}, 25);
			instance.unsubscribe(subscriptionId);
			expect(instance.subscriptions[channel]).to.not.be.undefined;
			expect(instance.subscriptions[channel][subscriptionId]).to.be.undefined;
			expect(instance.subscriptions[channel][subscriptionId2]).to.not.be.undefined;
			expect(instance.subscriptions[channel][subscriptionId3]).to.not.be.undefined;
		});
	});

	describe('filterTxOutputsByAddress(txData, address)', function() {

		it('should return only the tx outputs for the given address', function() {

			var fixtures = [
				{
					txData: {
						txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						valueOut: 2755.858108,
						vout: [
							{ 'QSGvFMpbdFHFXfo8F913e69wnATm5PptXp': 0.25 },
							{ 'QaAqKiTwm5qpYyjuSLRXhuAHtpBuWn6vFU': 2755.607416 }
						],
						isRBF: false
					},
					address: 'QSGvFMpbdFHFXfo8F913e69wnATm5PptXp',
					outputs: [0.25],
				},
				{
					txData: {
						txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						valueOut: 0.123704,
						vout: [
							{ 'QZv6Fop75UEqiMR2mzAcYR3m7DZtw6wMXr': 0.005 },
							{ 'QfQbM87ERGuwuAQWiCF8y61LebvZ4TYGTq': 0.1182552 }
						],
						isRBF: false
					},
					address: 'mnU1dPzEFkinXoswt8Bix1KU35RfHDYBTH',
					outputs: [],
				},
			];

			_.each(fixtures, function(fixture) {
				var outputs = instance.filterTxOutputsByAddress(fixture.txData, fixture.address);
				expect(outputs).to.deep.equal(fixture.outputs);
			});
		});
	});

	describe('sumTxOutputs(outputs)', function() {

		it('should return the sum of the outputs', function() {

			var fixtures = [
				{
					outputs: [0.25],
					sum: 0.25,
				},
				{
					outputs: [0.42, 50.23],
					sum: 50.65,
				},
				{
					outputs: [],
					sum: 0,
				},
			];

			_.each(fixtures, function(fixture) {
				var sum = instance.sumTxOutputs(fixture.outputs);
				expect(sum).to.equal(fixture.sum);
			});
		});
	});
});
