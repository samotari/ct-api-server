'use strict';

module.exports = function(app) {

	require('./exchange-rates')(app);
	require('./status')(app);
	require('./monero')(app);
};
