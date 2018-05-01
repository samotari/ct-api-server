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

	describe('instance', function() {

		var instance;
		before(function() {
			instance = _.first(app.services.insight.instances['bitcoin']);
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
});
