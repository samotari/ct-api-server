'use strict';

var _ = require('underscore');
var querystring = require('querystring');
var expect = require('chai').expect;

var manager = require('../../../manager');
var app = manager.app();

var verb = 'GET';
var uri = '/api/v1/monero/outputs';

describe([verb, uri].join(' '), function() {

	var client;

	var getUri = function(uri, params) {
		var url = uri;
		if (!_.isEmpty(params)) {
			url += '?' + querystring.stringify(params);
		}
		return url;
	};

	var txObject = {
		txhash: 'a5e50d89d4261036faf3d6d32f321e71ec8d810c64f268f321a3fe0cf8ee7968',
		address: '9wDZ4yA7aqiNQfnFrKsKQPM4jHyYRcdHdP5d5FDGa12YDs7QBFPwXgyZuk9WnCfAdvAKRWk4psFsYXb55xYGHgxmF6cxpUj',
		viewkey: '52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d',
		txprove: 0
	};

	before(function() {
		client = manager.client();
	});

	it('[testnet] Returns right object', function(done) {

		uri = getUri(uri, _.assign({ network: 'testnet' }, txObject))

		client[verb](uri, function(error, data, status, headers) {

			try {
				expect(error).to.equal(null);
				expect(status).to.equal(200);
				expect(data).to.be.an('object');
				expect(data.data).to.be.an('object');
				expect(data.status).to.be.equal('success');
				expect(data.data.outputs).to.be.an('array');
				expect(data.data.outputs[0]).to.be.an('object');
				expect(data.data.outputs[0]).to.have.property('amount');
				expect(data.data.outputs[0]).to.have.property('match');
				expect(data.data.outputs[0]).to.have.property('output_idx');
				expect(data.data.outputs[0]).to.have.property('output_pubkey');
				expect(data.data.viewkey).to.be.equal(txObject.viewkey);
			} catch (error) {
				return done(error);
			}

			done();
		});
	});

});
