'use strict';

var _ = require('underscore');
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var manager = require('../../manager');
var app = manager.app;

chai.use(chaiHttp);

var verb = 'post';
var uri = '/api/v1/raw-tx';

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

	describe('required post data', function() {
		_.each(['network', 'rawTx'], function(key, index, list) {
			it(key, function(done) {
				var postData = _.chain(list).map(function(_key) {
					return _key !== key ? [_key, 'test'] : null;
				}).compact().object().value();
				chai.request(app)[verb](uri).type('json').send(postData).end(function(error, response) {
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

		var postData = {
			network: 'unsupported',
			rawTx: '01000000014681d13abb326a8eeab1f429bbc5b47ece5c4baca699d5cebab5139b37c25c2d010000006a47304402206d834448667483f3b2d166d0ea73cd8e41eb9f4627e10abf9054cea95734685c0220392ec307bcb252c1a6739963792aa94ec5a1c50f10c918bd70438029586a1856012103295357b186865cb7bc137b8fbec0245af88284336d17f56c216e5a68856b785fffffffff020000000000000000536a4c50000106200001abfb52525b7a7c9e3b3d21dd7c1a771300fcfb3f5c7468dde34a364c5e8d675ddd5534cea7fbcc7cb474fa6128e55b68184c0600a2dedbd759e6635f13f7cab1f07f85b53adc13df02c6488fef01000000001976a914ebc969edaa3278ceb0b8480f1b808490ccaa1d9488ac00000000'
		};

		chai.request(app)[verb](uri).type('json').send(postData).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(400);
			expect(response.body).to.deep.equal({
				error: {
					status: 400,
					message: 'Unsupported network: "' + postData.network + '"'
				}
			});
			done();
		});
	});

	it('valid request', function(done) {

		mockResponseData = [true, '4427f16f14e16a38a5a23ac43baad2279ac709dbaab8a0d8ebd9d77e633e0150'];

		var postData = {
			network: _.keys(app.config.electrum)[0],
			rawTx: '01000000014681d13abb326a8eeab1f429bbc5b47ece5c4baca699d5cebab5139b37c25c2d010000006a47304402206d834448667483f3b2d166d0ea73cd8e41eb9f4627e10abf9054cea95734685c0220392ec307bcb252c1a6739963792aa94ec5a1c50f10c918bd70438029586a1856012103295357b186865cb7bc137b8fbec0245af88284336d17f56c216e5a68856b785fffffffff020000000000000000536a4c50000106200001abfb52525b7a7c9e3b3d21dd7c1a771300fcfb3f5c7468dde34a364c5e8d675ddd5534cea7fbcc7cb474fa6128e55b68184c0600a2dedbd759e6635f13f7cab1f07f85b53adc13df02c6488fef01000000001976a914ebc969edaa3278ceb0b8480f1b808490ccaa1d9488ac00000000'
		};

		chai.request(app)[verb](uri).type('json').send(postData).end(function(error, response) {
			expect(error).to.be.null;
			expect(response).to.have.status(200);
			expect(response.body).to.deep.equal({
				txid: mockResponseData[1]
			});
			done();
		});
	});
});
