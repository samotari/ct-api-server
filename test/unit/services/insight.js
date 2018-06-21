'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.insight', function() {

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
							txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
							value: 100000,
						},
						{
							address: 'QaAqKiTwm5qpYyjuSLRXhuAHtpBuWn6vFU',
							txid: '522f86bb689c33a8306b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
							value: 700000,
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
							txid: '522f86bb689c33a8354b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
							value: 5500000,
						},
						{
							address: 'QfQbM87ERGuwuAQWiCF8y61LebvZ4TYGTq',
							txid: '522f86bb689c33a8354b8e6aacb7917f076536bb1ab57a274e3ee92b7b2d1be0',
							value: 4500000,
						},
					],
				},
			];

			_.each(fixtures, function(fixture) {
				var output = app.services.insight.reorganizeTxData(fixture.input);
				expect(output).to.deep.equal(fixture.output);
			});
		});
	});
});
