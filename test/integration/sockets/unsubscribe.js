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

		describe('with other client(s) subscribed', function() {

			var anotherClient;
			beforeEach(function(done) {
				anotherClient = manager.socketClient();
				anotherClient.socket.once('open', function() {
					done();
				});
			});

			beforeEach(function(done) {
				anotherClient.subscribe(channel, done);
			});

			it('only unsubscribes the client that requested to be unsubscribed', function(done) {
				client.unsubscribe(channel, function(error) {
					if (error) return done(error);
					expect(!_.isEmpty(app.sockets.subscriptions[channel])).to.equal(true);
					anotherClient.socket.id(function(id) {
						expect(app.sockets.subscriptions[channel][id]).to.not.be.undefined;
						done();
					});
				});
			});
		});
	});
});
