'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('Insight', function() {

	var instance;
	beforeEach(function() {
		instance = new app.lib.Insight();
	});

	describe('reorganizeTxData(txData)', function() {

		it('should re-organize the tx data', function() {

			var fixtures = [
				{
					input: {
						txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						valueOut: 0.008,
						vout: [
							{ 'QSGvFMpbdFHFXfo8F913e69wnATm5PptXp': 100000 },
							{ 'QaAqKiTwm5qpYyjuSLRXhuAHtpBuWn6vFU': 700000 }
						],
						isRBF: false
					},
					output: [
						{
							address: 'QSGvFMpbdFHFXfo8F913e69wnATm5PptXp',
							amount: 100000,
							txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						},
						{
							address: 'QaAqKiTwm5qpYyjuSLRXhuAHtpBuWn6vFU',
							amount: 700000,
							txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						},
					],
				},
				{
					input: {
						txid: '522f86bb689c33a8354b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						valueOut: 0.1,
						vout: [
							{ 'QZv6Fop75UEqiMR2mzAcYR3m7DZtw6wMXr': 5500000 },
							{ 'QfQbM87ERGuwuAQWiCF8y61LebvZ4TYGTq': 4500000 }
						],
						isRBF: false
					},
					output: [
						{
							address: 'QZv6Fop75UEqiMR2mzAcYR3m7DZtw6wMXr',
							amount: 5500000,
							txid: '522f86bb689c33a8354b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						},
						{
							address: 'QfQbM87ERGuwuAQWiCF8y61LebvZ4TYGTq',
							amount: 4500000,
							txid: '522f86bb689c33a8354b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
						},
					],
				},
			];

			_.each(fixtures, function(fixture) {
				var output = instance.reorganizeTxData(fixture.input);
				expect(output).to.deep.equal(fixture.output);
			});
		});
	});
});
