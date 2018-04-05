'use strict';

module.exports = function(app) {

	return {
		coinbase: require('./coinbase')(app),
		poloniex: require('./poloniex')(app),
		xmrchain: require('./xmrchain')(app),
	};
};
