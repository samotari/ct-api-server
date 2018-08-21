'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var request = require('request');
	var querystring = require('querystring');

	return {
		getUri: function(uri, params) {

			if (!app.config.coinbase.baseUrl) {
				return null;
			}

			var url = app.config.coinbase.baseUrl + uri;

			if (!_.isEmpty(params)) {
				url += '?' + querystring.stringify(params);
			}

			return url;
		},
		getExchangeRates: function(currency, cb) {

			var uri = this.getUri('/v2/exchange-rates', { currency: currency });

			if (!uri) {
				return _.defer(function() {
					cb(new Error('Cannot get exchange rates from coinbase: Missing "baseUrl"'));
				});
			}

			request(uri, function(error, response, data) {

				if (error) {
					return cb(error);
				}

				if (response.statusCode >= 400) {
					return cb(new Error('Failed to get exchange rates from coinbase (HTTP ' + response.statusCode + ')'))
				}

				try {
					data = JSON.parse(data);
				} catch (error) {
					return cb(error);
				}

				cb(null, data);
			});
		},
	};
};
