'use strict';

var config = module.exports = {
	host: process.env.CT_API_SERVER_HOST || 'localhost',
	port: parseInt(process.env.CT_API_SERVER_PORT || 3600),
	supportedDisplayCurrencies: ['CZK', 'EUR', 'USD', 'BTC', 'LTC', 'XMR'],
	webRoot: process.env.CT_API_SERVER_WEBROOT || null,
	primus: {
		pathname: '/primus',
		transformer: 'uws',
		pingInterval: 5000,
	},
	insight: {
		bitcoin: {
			baseUrl: 'https://bitcore2.trezor.io',
		},
		bitcoinTestnet: {
			baseUrl: 'https://testnet-bitcore2.trezor.io',
		},
		litecoin: {
			baseUrl: 'https://ltc-bitcore2.trezor.io',
		},
		litecoinTestnet: {
			baseUrl: 'https://testnet.litecore.io',
		},
	},
};
