'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.insight', function() {

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
				var outputs = app.services.insight.filterTxOutputsByAddress(fixture.txData, fixture.address);
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
				var sum = app.services.insight.sumTxOutputs(fixture.outputs);
				expect(sum).to.equal(fixture.sum);
			});
		});
	});
});
