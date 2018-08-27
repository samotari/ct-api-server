'use strict';

module.exports = function(app) {

	require('./fee-rate')(app);
	require('./monero')(app);
	require('./raw-tx')(app);
	require('./status')(app);
	require('./utxo')(app);
};
