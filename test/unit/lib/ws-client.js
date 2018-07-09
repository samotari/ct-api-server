'use strict';

var _ = require('underscore');
var async = require('async');
var WebSocket = require('ws');

var manager = require('../../manager');
var app = manager.app();

describe('WebSocketClient', function() {

	var waitForClientConnectionState = function(connected, cb) {
		async.until(function() { return instance.connected === connected; }, function(next) {
			_.delay(next, 5);
		}, cb);
	};

	var port = 3606;
	var wss;
	var startServer = function() {
		wss = new WebSocket.Server({ port: port });
	};

	var killServer = function(cb) {
		wss.close(cb);
	};

	before(startServer);

	var instance;
	before(function(done) {
		instance = new app.lib.BlockCypher({
			url: 'ws://localhost:' + port,
			reconnectDelay: 0,
		});
		instance.connect(done);
	});

	describe('reconnect', function() {

		it('many disconnects', function(done) {

			async.timesSeries(12, function(index, nextTime) {

				// Wait until the client is disconnected.
				waitForClientConnectionState(false, function() {
					// Restart the server.
					startServer();
					// Wait until the client is reconnected.
					waitForClientConnectionState(true, nextTime);
				});

				// Disconnect the server.
				killServer();

			}, done);
		})

		it('should auto-reconnect after the server disconnects', function(done) {

			// Wait until the client is disconnected.
			waitForClientConnectionState(false, function() {
				// Restart the server.
				startServer();
				// Wait until the client is reconnected.
				waitForClientConnectionState(true, done);
			});

			// Disconnect the server.
			killServer();
		});
	});
});
