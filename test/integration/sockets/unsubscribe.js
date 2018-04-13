'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('socket', function() {

	var client;
	beforeEach(function(done) {
		client = manager.socketClient();
		client.socket.once('open', function() {
			done();
		});
	});

	afterEach(function() {
		if (client) {
			client.socket.destroy();
			client = null;
		}
	});

	describe('unsubscribe', function() {

		var channel = 'test';
		beforeEach(function(done) {
			client.subscribe(channel, done);
		});

		it('can unsubscribe from a channel', function(done) {
			client.unsubscribe(channel, done);
		});
	});
});
