'use strict';

var _ = require('underscore');
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

		var method = 'test123';
		var instance;
		before(function() {
			instance = new app.lib.Insight({}/* config */);
			app.services.insight.instances[method] = [instance];
		});

		after(function() {
			delete app.services.insight.instances[method];
		});

		describe('with no connected instances', function() {

			before(function() {
				instance.socket = { connected: false };
			});

			it('should fail', function() {
				var thrownError;
				try {
					app.services.insight.listenToAddress(method, 'some-address-321', _.noop);
				} catch (error) {
					thrownError = error;
				}
				expect(thrownError).to.not.be.undefined;
			});
		});

		describe('with at least one connected instance', function() {

			before(function() {
				instance.socket = { connected: true };
			});

			it('should start listening to a connected instance for the given method', function(done) {
				var testArgs = {
					address: 'some-address-123',
					onData: function(data) {},
				}
				instance.listenToAddress = function(address, onData) {
					expect(address).to.equal(testArgs.address);
					expect(onData).to.equal(testArgs.onData);
					done();
				};
				app.services.insight.listenToAddress(method, testArgs.address, testArgs.onData);
			});
		});
	});
});
