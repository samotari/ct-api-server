'use strict';

var config = module.exports = {
	host: process.env.CT_API_SERVER_HOST || 'localhost',
	port: parseInt(process.env.CT_API_SERVER_PORT || 3600),
	supportedDisplayCurrencies: ['CZK', 'EUR', 'USD', 'BTC', 'LTC', 'XMR'],
	primus: {
		pathname: '/primus',
		transformer: 'uws',
		pingInterval: 5000,
	},
};
