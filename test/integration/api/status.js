'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

var verb = 'GET';
var uri = '/api/v1/status';

describe([verb, uri].join(' '), function() {

	var client;

	before(function() {
		client = manager.client();
	});

	it('OK', function(done) {

		client[verb](uri, function(error, data, status, headers) {

			try {
				expect(error).to.equal(null);
				expect(status).to.equal(200);
				expect(data).to.be.an('object');
				expect(data.status).to.equal('OK');
			} catch (error) {
				return done(error);
			}

			done();
		});
	});
});
