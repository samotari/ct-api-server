'use strict';

module.exports = function(app) {

	return {
		exchangeRates: require('./exchange-rates')(app),
	};
};
