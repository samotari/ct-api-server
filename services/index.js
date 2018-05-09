'use strict';

module.exports = function(app) {

	return {
		coinbase: require('./coinbase')(app),
		insight: require('./insight')(app),
		poloniex: require('./poloniex')(app),
		onionMoneroBlockchainExplorer: require('./onion-monero-blockchain-explorer')(app),
	};
};
