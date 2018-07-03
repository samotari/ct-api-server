'use strict';

module.exports = function(grunt) {

	var config = {
		test: {
			NODE_ENV: 'test',
			CT_API_SERVER_HOST: 'localhost',
			CT_API_SERVER_PORT: 3601,
			CT_API_SERVER_BLOCK_CYPHER: JSON.stringify({
				networks: {},
			}),
			CT_API_SERVER_COINBASE: JSON.stringify({}),
			CT_API_SERVER_ONION_MONERO_BLOCKCHAIN_EXPLORER: JSON.stringify({
				mainnet: [],
				testnet: [],
			}),
			CT_API_SERVER_INSIGHT: JSON.stringify({
				hosts: {
					bitcoin: [],
					bitcoinTestnet: [],
					litecoin: [],
				},
				listenToAddress: {
					timeout: 5000,
				},
			}),
			CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT: 'false',
			CT_API_SERVER_MONERO_TXS_POLLING_INIT: 'false',
			CT_API_SERVER_BLOCK_IO: JSON.stringify({}),
		}
	};

	return config;
};
