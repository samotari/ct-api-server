'use strict';

var _ = require('underscore');
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var manager = require('../../manager');
var app = manager.app;

chai.use(chaiHttp);

var verb = 'get';
var uri = '/api/v1/utxo';

describe([verb.toUpperCase(), uri].join(' '), function() {

	var mockResponseData;
	beforeEach(function() {
		mockResponseData = null;
	});

	var mock;
	before(function(done) {
		mock = manager.createMockServer(function(error, baseUrl) {
			if (error) return done(error);
			mock.post('/', function(req, res, next) {
				res.status(200).send(JSON.stringify({
					result: mockResponseData
				}));
			});
			app.config.electrum = {
				bitcoinTestnet: {
					uri: baseUrl,
					username: 'test',
					password: 'test',
				},
			};
			app.services.electrum.prepareInstances();
			done();
		});
	});

	after(function() {
		app.services.electrum.resetInstances();
		app.config.electrum = {};
	});

	describe('required query parameters', function() {
		_.each(['addresses', 'network'], function(key, index, list) {
			it(key, function(done) {
				var params = _.chain(list).map(function(_key) {
					return _key !== key ? [_key, 'test'] : null;
				}).compact().object().value();
				chai.request(app)[verb](uri).query(params).end(function(error, response) {
					expect(error).to.be.null;
					expect(response).to.have.status(400);
					expect(response.body).to.deep.equal({
						error: {
							status: 400,
							message: 'Error: "' + key + '" required'
						}
					});
					done();
				});
			});
		});
	});

	it('unsupported network', function(done) {

		var params = {
			addresses: 'test',
			network: 'unsupported',
		};

		chai.request(app)[verb](uri).query(params).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(400);
			expect(response.body).to.deep.equal({
				error: {
					status: 400,
					message: 'Unsupported network: "' + params.network + '"'
				}
			});
			done();
		});
	});

	it('invalid addresses', function(done) {

		var params = {
			addresses: ',',
			network: _.keys(app.config.electrum)[0],
		};

		chai.request(app)[verb](uri).query(params).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(400);
			expect(response.body).to.deep.equal({
				error: {
					status: 400,
					message: 'Must provide at least one address'
				}
			});
			done();
		});
	});

	it('valid request', function(done) {

		mockResponseData = [
			{
				tx_hash: '4427f16f14e16a38a5a23ac43baad2279ac709dbaab8a0d8ebd9d77e633e0150',
				tx_pos: 0,
				value: 5000,
			},
		];

		var params = {
			addresses: 'anAddress,another',
			network: _.keys(app.config.electrum)[0],
		};

		var expectedResponseData = _.map(params.addresses.split(','), function(address) {
			return {
				address: address,
				utxo: mockResponseData,
			};
		});

		chai.request(app)[verb](uri).query(params).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(200);
			expect(response.body).to.deep.equal(expectedResponseData);
			done();
		});
	});
});
