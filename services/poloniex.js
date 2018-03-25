'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var querystring = require('querystring');
	var request = require('request');

	return {
		hostname: 'https://poloniex.com',
		getUri: function(uri, params) {
			var url = this.hostname + uri;
			if (!_.isEmpty(params)) {
				url += '?' + querystring.stringify(params);
			}
			return url;
		},
		getExchangeRates: function(cb) {
			var uri = this.getUri('/public', { command: 'returnTicker' });
			request(uri, function(error, response, data) {
				if (error) {
					return cb(error);
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
