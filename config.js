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
	blockCypher: {
		networks: {
			bitcoin: {
				ws: 'socket.blockcypher.com/v1/btc/main',
			},
			bitcoinTestnet: {
				ws: 'socket.blockcypher.com/v1/btc/test3',
			},
			litecoin: {
				ws: 'socket.blockcypher.com/v1/ltc/main',
			},
		},
	},
	onionMoneroBlockchainExplorer: {
		mainnet: [
			'xmrchain.com',
			'moneroexplorer.pro',
		],
		testnet: [
			'testnet.xmrchain.com',
		],
	},
	insight: {
		hosts: {
			bitcoin: [
				{ baseUrl: 'https://insight.bitpay.com' },
			],
			bitcoinTestnet: [
				{ baseUrl: 'https://testnet-bitcore1.trezor.io' },
				{ baseUrl: 'https://testnet-bitcore2.trezor.io' },
				{ baseUrl: 'https://test-insight.bitpay.com' },
			],
			litecoin: [
				{ baseUrl: 'https://ltc-bitcore1.trezor.io' },
				{ baseUrl: 'https://ltc-bitcore2.trezor.io' },
				{ baseUrl: 'https://insight.litecore.io' },
			],
			litecoinTestnet: [],
		},
		listenToAddress: {
			timeout: 5000,
		},
	},
};
