'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.block-cypher', function() {

	describe('EVENT: \'tx:NETWORK\'', function() {

		var method = 'somenetwork1234';
		var instance;

		beforeEach(function() {
			instance = app.services.blockCypher.addInstance({}, method);
		});

		afterEach(function(done) {
			instance.close(done);
		});

		it('should propagate new transaction events from instances', function(done) {

			app.services.blockCypher.on('tx:' + method, function(data) {
				try {
					expect(data).to.be.an('object');
					expect(data).to.deep.equal(tx);
				} catch (error) {
					return done(error);
				}
				done();
			});

			var tx = {
				address: '123456someaddress',
				amount: 5000,
				txid: '522f86bb679ca9d38306b8e6aacb7917f07653ebb1ab57a274e3ee92b7b2d1be0',
			};

			instance.emit('tx', tx);
		});
	});
});
