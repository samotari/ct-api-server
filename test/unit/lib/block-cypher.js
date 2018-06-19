'use strict';

var _ = require('underscore');
var async = require('async');
var WebSocket = require('ws');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('block-cypher', function() {

	var port = 3606;
	var wss;
	before(function() {
		wss = new WebSocket.Server({ port: port });
	});

	var instance;
	before(function(done) {
		var config = {
			method: 'test-xyz1',
			network: {
				ws: 'ws://localhost:' + port,
			},
		};
		instance = new app.lib.BlockCypher(config);
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
