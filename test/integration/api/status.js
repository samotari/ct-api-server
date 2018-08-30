'use strict';

var _ = require('underscore');
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var manager = require('../../manager');
var app = manager.app;

chai.use(chaiHttp);

var verb = 'get';
var uri = '/api/v1/status';

describe([verb.toUpperCase(), uri].join(' '), function() {

	it('OK', function(done) {

		chai.request(app)[verb](uri).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(200);
			expect(response.body).to.be.an('object');
			expect(response.body.status).to.equal('OK');
			done();
		});
	});
});
