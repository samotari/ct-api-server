'use strict';

module.exports = function(grunt) {

	var config = {
		test: {
			NODE_ENV: 'test',
			CT_API_SERVER_HOST: 'localhost',
			CT_API_SERVER_PORT: 3601,
		}
	};

	return config;
};
