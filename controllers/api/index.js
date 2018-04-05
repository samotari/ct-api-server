'use strict';

module.exports = function(app) {

	require('./exchange-rates')(app);
	require('./monero')(app);
};
