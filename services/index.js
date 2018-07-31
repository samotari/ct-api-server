'use strict';

module.exports = function(app) {

	return {
		bitcoindZeroMQ: require('./bitcoind-zeromq')(app),
		blockCypher: require('./block-cypher')(app),
		blockIO: require('./block-io')(app),
		coinbase: require('./coinbase')(app),
		insight: require('./insight')(app),
		poloniex: require('./poloniex')(app),
		onionMoneroBlockchainExplorer: require('./onion-monero-blockchain-explorer')(app),
	};
};
