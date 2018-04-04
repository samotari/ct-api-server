'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var BigNumber = require('bignumber.js');

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
				var rates = {};
				_.each(results.coinbase.data.rates, function(rate, code) {
					code = code.toUpperCase();
					if (_.contains(app.config.supportedDisplayCurrencies, code)) {
						rates[code] = rate;
					}
				});
				var xmrToBtcRate = new BigNumber(results.poloniex.BTC_XMR.last);
				rates['XMR'] = (new BigNumber(rates['BTC'])).dividedBy(xmrToBtcRate).toString();
			} catch (error) {
				return cb(error);
			}

			cb(null, rates);
		});
	};
};

