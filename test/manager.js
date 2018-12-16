'use strict';

var _ = require('underscore');

process.env = _.defaults(process.env || {}, {
	NODE_ENV: 'test',
	CT_API_SERVER_HOST: 'localhost',
	CT_API_SERVER_PORT: 3601,
	CT_API_SERVER_COINBASE: JSON.stringify({}),
	CT_API_SERVER_ONION_MONERO_BLOCKCHAIN_EXPLORER: JSON.stringify({
		mainnet: [],
		testnet: [],
	}),
	CT_API_SERVER_EXCHANGE_RATES_POLLING_INIT: 'false',
	CT_API_SERVER_MONERO_TXS_POLLING_INIT: 'false',
});

if (process.env.NODE_ENV !== 'test') {
	throw new Error('NODE_ENV must be set to "test" to run tests');
}

var async = require('async');
var express = require('express');
var app = require('../');

var manager = module.exports = {

	app: app,
	config: app.config,
	fixtures: require('./fixtures'),
	servers: [],

	url: function(uri) {

		return 'http://' + manager.config.host + ':' + manager.config.port + uri;
	},

	socketClient: function(options) {

		options = _.defaults(options || {}, {
			host: app.config.host,
			port: app.config.port
		});

		var uri = 'http://' + options.host + ':' + options.port;
		var socket = new app.sockets.primus.Socket(uri);

		return {
			onError: function(cb) {
				this.socket.on('data', function(data) {
					if (data.error) {
						cb(new Error(data.error));
					}
				});
			},
			subscribe: function(channel, done) {
				socket.write({
					action: 'join',
					channel: channel,
				});
				socket.id(function(id) {
					async.until(function() {
						var spark = app.sockets.primus.spark(id);
						return spark.isInChannel(channel);
					}, function(next) {
						_.delay(next, 5);
					}, done);
				});
			},
			unsubscribe: function(channel, done) {
				socket.write({
					action: 'leave',
					channel: channel,
				});
				socket.id(function(id) {
					async.until(function() {
						var spark = app.sockets.primus.spark(id);
						return !spark.isInChannel(channel);
					}, function(next) {
						_.delay(next, 5);
					}, done);
				});
			},
			socket: socket,
		};
	},

	waitFor: function(test, cb) {

		async.until(
			test,
			function(next) { _.delay(next, 5) },
			cb
		);
	},

	createMockServer: function(cb) {

		var mock = express();
		var port = 3700 + manager.servers.length;
		var host = 'localhost';
		mock.server = mock.listen(port, host, function(error) {
			if (error) return cb(error);
			var address = mock.server.address();
			var host = address.address;
			var port = address.port;
			var baseUrl = 'http://' + host + ':' + port;
			cb(null, baseUrl);
		});
		manager.servers.push(mock.server);
		return mock;
	},

	closeMockServers: function() {

		_.invoke(manager.servers, 'close');
		manager.servers = [];
	},

};

// Global hooks:
before(app.onReady);
after(manager.closeMockServers);
after(function(done) {
	app.close(done);
});
