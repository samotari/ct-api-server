'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var BigNumber = require('bignumber.js');

	var supportedDisplayCurrencies = _.chain(app.config.supportedDisplayCurrencies).clone().map(function(code) {
		return [code, true];
	}).object().value();

	return function(cb) {

		async.parallel({
			coinbase: function(next) {
				app.services.coinbase.getExchangeRates('BTC', next);
			},
			poloniex: function(next) {
				app.services.poloniex.getExchangeRates(next);
			}
		}, function(error, results) {

			if (error) {
				return cb(error);
			}

			try {
				var rates = _.chain(results.coinbase.data.rates).map(function(rate, code) {
					if (!supportedDisplayCurrencies[code]) return null;
					// Remove trailing zeros.
					rate = (new BigNumber(rate)).toString();
					return [code, rate];
				}).compact().object().value();
				var xmrToBtcRate = new BigNumber(results.poloniex.BTC_XMR.last);
				rates['XMR'] = (new BigNumber(rates['BTC'])).dividedBy(xmrToBtcRate).toPrecision(12).toString();
			} catch (error) {
				return cb(error);
			}

			cb(null, rates);
		});
	};
};

