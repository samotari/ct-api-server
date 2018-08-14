'use strict';

module.exports = function(app) {

	return {
		bitcoin: app.lib.BitcoinProvider('bitcoin')(app),
		bitcoinTestnet: app.lib.BitcoinProvider('bitcoinTestnet')(app),
		exchangeRates: require('./exchange-rates')(app),
		litecoin: app.lib.BitcoinProvider('litecoin')(app),
		monero: require('./monero')(app),
		statusCheck: require('./status-check')(app),
	};
};
