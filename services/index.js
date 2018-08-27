'use strict';

module.exports = function(app) {

	return {
		electrum: require('./electrum')(app),
		bitcoindZeroMQ: require('./bitcoind-zeromq')(app),
		coinbase: require('./coinbase')(app),
		poloniex: require('./poloniex')(app),
		onionMoneroBlockchainExplorer: require('./onion-monero-blockchain-explorer')(app),
	};
};
