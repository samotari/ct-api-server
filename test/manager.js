'use strict';

if (process.env.NODE_ENV !== 'test') {
	throw new Error('NODE_ENV must be set to "test" to run tests');
}

var _ = require('underscore');
var async = require('async');
var app = require('../');
var Client = require('./client');

var manager = module.exports = {

	config: app.config,

	url: function(uri) {

		return 'http://' + manager.config.host + ':' + manager.config.port + uri;
	},

	app: function() {

		return app;
	},

	client: function(options) {

		options = _.defaults(options || {}, {
			host: app.config.host,
			port: app.config.port
		});

		return new Client(options);
	},

	socketClient: function(options) {

		options = _.defaults(options || {}, {
			host: app.config.host,
			port: app.config.port
		});

		var uri = 'http://' + options.host + ':' + options.port;
		var socket = new app.sockets.primus.Socket(uri);

		return {
			subscribe: function(channel, done) {
				socket.write({
					action: 'join',
					channel: channel,
				});
				socket.id(function(id) {
					async.until(function() {
						return !!app.sockets.subscriptions[channel] && !!app.sockets.subscriptions[channel][id];
					}, function(next) {
						_.delay(next, 10);
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
						return !app.sockets.subscriptions[channel] || !app.sockets.subscriptions[channel][id];
					}, function(next) {
						_.delay(next, 10);
					}, done);
				});
			},
			socket: socket,
		};
	},
};

// Global hooks:
before(app.onReady);
