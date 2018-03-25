'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');
	var BigNumber = require('bignumber.js');

	app.get('/api/v1/exchange-rates', function(req, res, next) {

		var currency = req.query.currency;

		if (!currency) {
			var error = new Error('"currency" required');
			error.status = 400;
			return next(error);
		}

		if (!_.contains(['BTC', 'LTC', 'XMR'], currency)) {
			var error = new Error('"' + currency + '" is not supported');
			error.status = 400;
			return next(error);
		}

		currency = currency.toUpperCase();

		async.parallel({
			coinbase: function(cb) {
				// Coinbase doesn't support XMR. So get BTC instead.
				app.services.coinbase.getExchangeRates(currency === 'XMR' ? 'BTC' : currency, cb);
			},
			poloniex: function(cb) {
				app.services.poloniex.getExchangeRates(cb);
			}
		}, function(error, results) {

			if (error) {
				return next(error);
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
				if (currency === 'XMR') {
					// Convert from Fiat->BTC rate to Fiat->XMR.
					rates = _.mapObject(rates, function(rate) {
						return xmrToBtcRate.times(rate).toString();
					});
				} else {
					rates['XMR'] = (new BigNumber(rates['BTC'])).dividedBy(xmrToBtcRate).toString();
				}
				delete rates[currency];
			} catch (error) {
				return next(error);
			}

			res.status(200).json(rates);
		});
	});
};
