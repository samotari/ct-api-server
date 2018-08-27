'use strict';

var config = module.exports = {
	debug: true,
	host: process.env.CT_API_SERVER_HOST || 'localhost',
	port: parseInt(process.env.CT_API_SERVER_PORT || 3600),
	supportedDisplayCurrencies: [
		// Cryptocurrencies:
		'BTC', 'ETH', 'LTC', 'XMR',
		// Other:
		'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF', 'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN', 'UYI', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF', 'XPD', 'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW', 'ZWL'
	],
	webRoot: process.env.CT_API_SERVER_WEBROOT || null,
	logs: {
		frequency: 5 * 60 * 1000,
	},
	statusProviding: {
		init: typeof process.env.CT_API_SERVER_STATUS_PROVIDING_INIT !== 'undefined' ? process.env.CT_API_SERVER_STATUS_PROVIDING_INIT !== 'false' : true,
		frequency: 1000,
	},
	primus: {
		pathname: '/primus',
		transformer: 'websockets',
		pingInterval: 5000,
	},
	electrum: process.env.CT_API_SERVER_ELECTRUM ? JSON.parse(process.env.CT_API_SERVER_ELECTRUM) : {
		// bitcoinTestnet: {
		// 	uri: 'http://localhost:8332',
		// 	username: 'example',
		// 	password: '12345',
		// },
	},
	zeromq: process.env.CT_API_SERVER_ZEROMQ ? JSON.parse(process.env.CT_API_SERVER_ZEROMQ) : {
		// Examples as follows:
		// bitcoin: [
		// 	{
		// 		dataUrl: 'tcp://127.0.0.1:7001',
		// 		statusUrl: 'https://bitcoin-node-status-url',
		// 	},
		// ],
		// bitcoinTestnet: [
		// 	{
		// 		dataUrl:'tcp://127.0.0.1:7002',
		// 		statusUrl: 'https://bitcoin-testnet-node-status-url',
		// 	},
		// ],
		// litecoin: [
		// 	{
		// 		dataUrl: 'tcp://127.0.0.1:7003',
		// 		statusUrl: 'https://litecoin-node-status-url',
		// 	},
		// ],
	},
	bitcoin: {
		rebroadCastRecentTxs: {
			enable: true,
			maxAge: 5000,
		},
	},
	exchangeRates: {
		polling: {
			init: typeof process.env.CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT !== 'undefined' ? process.env.CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT !== 'false' : true,
			retryDelayOnError: 30 * 1000,
			frequency: 5 * 60 * 1000,
		},
	},
	coinbase: process.env.CT_API_SERVER_COINBASE ? JSON.parse(process.env.CT_API_SERVER_COINBASE) : {
		baseUrl: 'https://api.coinbase.com',
	},
	onionMoneroBlockchainExplorer: process.env.CT_API_SERVER_ONION_MONERO_BLOCKCHAIN_EXPLORER ? JSON.parse(process.env.CT_API_SERVER_ONION_MONERO_BLOCKCHAIN_EXPLORER) : {
		mainnet: [
			'https://xmrchain.com',
			'https://moneroexplorer.pro',
		],
		testnet: [
			'https://testnet.xmrchain.com',
		],
	},
	moneroTxs: {
		polling: {
			frequency: 4000,
		},
	},
	poloniex: process.env.CT_API_SERVER_POLONIEX ? JSON.parse(process.env.CT_API_SERVER_POLONIEX) : {
		baseUrl: 'https://poloniex.com',
	},
};
