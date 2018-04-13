'use strict';

module.exports = function(grunt) {

	var config = {
		test: {
			NODE_ENV: 'test',
			CT_WEB_PLATFORM_HOST: 'localhost',
			CT_WEB_PLATFORM_PORT: 3601,
		}
	};

	return config;
};
