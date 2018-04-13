'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('socket', function() {

	var client;
	afterEach(function() {
		if (client) {
			client.socket.destroy();
			client = null;
		}
	});

	describe('connect', function() {

		it('can open a websocket connection', function(done) {
			client = manager.socketClient();
			client.socket.once('open', function() {
				done();
			});
		});
	});
});
