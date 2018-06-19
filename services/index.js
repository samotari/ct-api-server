'use strict';

module.exports = function(app) {

	return {
		blockCypher: require('./block-cypher')(app),
		coinbase: require('./coinbase')(app),
		insight: require('./insight')(app),
		poloniex: require('./poloniex')(app),
		onionMoneroBlockchainExplorer: require('./onion-monero-blockchain-explorer')(app),
	};
};
