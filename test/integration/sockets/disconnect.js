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

	describe('disconnect', function() {

		var channel = 'test-disconnect123';
		beforeEach(function(done) {
			client.subscribe(channel, done);
		});

		var spark;
		beforeEach(function(done) {
			client.socket.id(function(id) {
				spark = app.sockets.primus.spark(id);
				done();
			});
		});

		beforeEach(function(done) {
			spark.once('end', done);
			client.socket.destroy();
			client = null;
		});

		it('channels object hashes were cleaned up properly', function() {
			expect(spark).to.not.be.undefined;
			// Check the global channels object hash.
			expect(app.sockets.channels[channel]).to.be.an('object');
			expect(app.sockets.channels[channel][spark.id]).to.equal(null);
			// And the spark's channels object hash.
			expect(spark.channels[channel]).to.be.undefined;
		});

		it('broadcasting to the channel does cause an error', function() {
			app.sockets.broadcastToChannel(channel, { some: 'data123' });
		});
	});
});
