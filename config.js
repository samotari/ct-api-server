'use strict';

var config = module.exports = {
	debug: false,
	host: process.env.CT_API_SERVER_HOST || 'localhost',
	port: parseInt(process.env.CT_API_SERVER_PORT || 3600),
	supportedDisplayCurrencies: ['CZK', 'EUR', 'USD', 'BTC', 'LTC', 'XMR'],
	webRoot: process.env.CT_API_SERVER_WEBROOT || null,
	primus: {
		pathname: '/primus',
		transformer: 'uws',
		pingInterval: 5000,
	},
	exchangeRates: {
		polling: {
			init: typeof process.env.CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT !== 'undefined' ? process.env.CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT !== 'false' : true,
			retryDelayOnError: 30 * 1000,
			frequency: 5 * 60 * 1000,
		},
	},
	blockCypher: process.env.CT_API_SERVER_BLOCK_CYPHER ? JSON.parse(process.env.CT_API_SERVER_BLOCK_CYPHER) : {
		networks: {
			bitcoin: {
				url: 'wss://socket.blockcypher.com/v1/btc/main',
			},
			bitcoinTestnet: {
				url: 'wss://socket.blockcypher.com/v1/btc/test3',
			},
			litecoin: {
				url: 'wss://socket.blockcypher.com/v1/ltc/main',
			},
		},
	},
	blockIO: process.env.CT_API_SERVER_BLOCK_IO ? JSON.parse(process.env.CT_API_SERVER_BLOCK_IO) : {
		url: 'wss://n.block.io/',
		networks: ['LTC'],
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
	insight: process.env.CT_API_SERVER_INSIGHT ? JSON.parse(process.env.CT_API_SERVER_INSIGHT) : {
		hosts: {
			bitcoin: [
				{ url: 'https://insight.bitpay.com' },
			],
			bitcoinTestnet: [
				{ url: 'https://test-insight.bitpay.com' },
			],
			litecoin: [
				{ url: 'https://insight.litecore.io' },
			],
			litecoinTestnet: [],
		},
		listenToAddress: {
			timeout: 5000,
		},
	},
	poloniex: process.env.CT_API_SERVER_POLONIEX ? JSON.parse(process.env.CT_API_SERVER_POLONIEX) : {
		baseUrl: 'https://poloniex.com',
	},
};
