'use strict';

module.exports = function(app) {

	require('./status')(app);
	require('./monero')(app);
};
