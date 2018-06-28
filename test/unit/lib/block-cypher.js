'use strict';

var _ = require('underscore');
var async = require('async');
var WebSocket = require('ws');

var manager = require('../../manager');
var app = manager.app();

describe('BlockCypher', function() {

	var port = 3606;
	var wss;
	before(function() {
		wss = new WebSocket.Server({ port: port });
	});

	var instance;
	before(function(done) {
		instance = new app.lib.BlockCypher({
			url: 'ws://localhost:' + port,
		});
		instance.connect(done);
	});

	describe('reconnect', function() {

		it('should auto-reconnect after the server disconnects', function(done) {

			// Wait until the client is disconnected.
			async.until(function() { return instance.connected === false; }, function(next) {
				_.delay(next, 5);
			}, function() {
				// Restart the server.
				wss = new WebSocket.Server({ port: port });
				// Wait until the client is reconnected.
				async.until(function() { return instance.connected === true; }, function(next) {
					_.delay(next, 5);
				}, done);
			});

			// Disconnect the server.
			wss.close(function(error) {
				if (error) return done(error);
			});
		});
	});
});
