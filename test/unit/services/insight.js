'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.insight', function() {

	describe('findInstanceByName(name)', function() {

		it('when instance does not exist', function() {
			expect(app.services.insight.findInstanceByName('does-not-exist')).to.equal(null);
		});

		it('instance exists', function() {
			var instance = _.first(app.services.insight.instances['bitcoin']);
			var found = app.services.insight.findInstanceByName(instance.name);
			expect(found).not.equal(null);
			expect(found).to.be.an('object');
			expect(found.name).to.equal(instance.name);
		});
	});

	describe('isSupportedMethod(method)', function() {

		it('unsupported method', function() {
			expect(app.services.insight.isSupportedMethod('unknown')).to.equal(false);
		});

		it('supported method', function() {
			expect(app.services.insight.isSupportedMethod('bitcoin')).to.equal(true);
		});
	});

	describe('getAnyConnectedInstanceByMethod(method)', function() {

		var method = 'test123';
		var instance;
		before(function() {
			instance = new app.lib.Insight({}/* config */);
			instance.method = method;
			app.services.insight.instances[method] = [instance];
		});

		after(function() {
			delete app.services.insight.instances[method];
		});

		it('unknown method', function() {
			expect(app.services.insight.getAnyConnectedInstanceByMethod('unknown')).to.equal(null);
		});

		it('no connected instances', function() {
			expect(app.services.insight.getAnyConnectedInstanceByMethod(method)).to.equal(null);
		});

		it('at least one connected instance', function() {
			instance.socket = { connected: true };
			var found = app.services.insight.getAnyConnectedInstanceByMethod(method);
			expect(found).to.not.equal(null);
			expect(found).to.be.an('object');
		});
	});

	describe('listenToAddress(method, address, onData)', function() {

		var io;
		var port = 4001;
		beforeEach(function() {
			io = require('socket.io')();
			io.listen(port);
		});

		var method = 'test123';
		var instance;
		beforeEach(function() {
			instance = new app.lib.Insight({
				baseUrl: 'http://localhost:' + port,
			});
			instance.method = method;
			app.services.insight.instances[method] = [instance];
		});

		var originalListenToAddress;
		beforeEach(function() {
			originalListenToAddress = instance.listenToAddress;
		});

		afterEach(function() {
			app.services.insight.clearSubscriptions();
		});

		afterEach(function() {
			instance.listenToAddress = originalListenToAddress;
		});

		afterEach(function() {
			instance.close();
		});

		afterEach(function(done) {
			if (!io) return done();
			io.close(done);
		});

		afterEach(function() {
			delete app.services.insight.instances[method];
		});

		describe('with at least one connected instance', function() {

			beforeEach(function(done) {
				app.services.insight.connectToInstance(instance, done);
			});

			it('should start listening to a connected instance for the given method', function(done) {
				var testArgs = {
					address: 'some-address-123',
					onData: function(data) {},
				};
				var called = false;
				instance.listenToAddress = function(address, onData) {
					called = true;
					expect(address).to.equal(testArgs.address);
					expect(onData).to.equal(testArgs.onData);
					return originalListenToAddress.apply(this, arguments);
				};
				app.services.insight.listenToAddress(method, testArgs.address, testArgs.onData, function(error, subscriptionId) {
					expect(error).to.equal(null);
					expect(subscriptionId).to.be.a('string');
					expect(called).to.equal(true);
					done();
				});
			});
		});

		describe('with at least one connected instance (with a delay)', function() {

			it('should start listening to a connected instance for the given method', function(done) {
				var testArgs = {
					address: 'some-other-address-321',
					onData: function(data) {},
				};
				var called = false;
				instance.listenToAddress = function(address, onData) {
					called = true;
					expect(address).to.equal(testArgs.address);
					expect(onData).to.equal(testArgs.onData);
					return originalListenToAddress.apply(this, arguments);
				};
				app.services.insight.listenToAddress(method, testArgs.address, testArgs.onData, function(error, subscriptionId) {
					expect(error).to.equal(null);
					expect(subscriptionId).to.be.a('string');
					expect(called).to.equal(true);
					done();
				});
				app.services.insight.connectToInstance(instance, function(error) {
					if (error) return done(error);
				});
			});
		});

		describe('with no connected instances (time-out)', function() {

			var timeoutBefore;
			before(function() {
				// Set a shorter time-out.
				timeoutBefore = app.config.insight.listenToAddress.timeout;
				app.config.insight.listenToAddress.timeout = 100;
			});

			after(function() {
				app.config.insight.listenToAddress.timeout = timeoutBefore;
			});

			it('should fail', function(done) {
				var called = false;
				instance.listenToAddress = function(address, onData) {
					called = true;
					return originalListenToAddress.apply(instance, arguments);
				};
				app.services.insight.listenToAddress(method, 'address123', _.noop, function(error, subscriptionId) {
					expect(error).to.not.equal(null);
					expect(subscriptionId).to.be.undefined;
					expect(called).to.equal(false);
					done();
				});
			});
		});

		describe('when connected instance disconnects after client starts listening', function() {

			var nextIO;
			var nextPort = 4002;
			beforeEach(function() {
				nextIO = require('socket.io')();
				nextIO.listen(nextPort);
			});

			var nextInstance;
			beforeEach(function(done) {
				nextInstance = new app.lib.Insight({
					baseUrl: 'http://localhost:' + nextPort,
				});
				nextInstance.method = method;
				app.services.insight.connectToInstance(nextInstance, done);
				app.services.insight.instances[method].push(nextInstance);
			});

			var nextInstanceOriginalListenToAddress;
			beforeEach(function() {
				nextInstanceOriginalListenToAddress = nextInstance.listenToAddress;
			});

			afterEach(function() {
				nextInstance.listenToAddress = nextInstanceOriginalListenToAddress;
			});

			afterEach(function() {
				nextInstance.socket.close();
			});

			afterEach(function(done) {
				nextIO.close(done);
			});

			it('should listen to the next connected instance', function(done) {
				var testArgs = {
					address: 'another-address456',
					onData: function(data) {},
				};
				nextInstance.listenToAddress = function(address, onData) {
					expect(address).to.equal(testArgs.address);
					expect(onData).to.equal(testArgs.onData);
					return nextInstanceOriginalListenToAddress.apply(this, arguments);
				};
				app.services.insight.listenToAddress(method, testArgs.address, testArgs.onData, function(error, subscriptionId) {
					expect(error).to.equal(null);
					expect(subscriptionId).to.be.a('string');
					done();
				});
				// Kill the socket.io server.
				io.close();
				io = null;
			});
		});
	});
});
