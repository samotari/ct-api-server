'use strict';

var expect = require('chai').expect;
var express = require('express');
var querystring = require('querystring');

var manager = require('../../../manager');
var app = manager.app();

var verb = 'GET';
var uri = '/api/v1/monero/outputs';

describe([verb, uri].join(' '), function() {

	var client;
	before(function() {
		client = manager.client();
	});

	var port = 3700;
	var server;
	before(function() {
		var tmpApp = express();
		server = tmpApp.listen(port, 'localhost');
		tmpApp.get('/api/outputs', function(req, res, next) {
			res.send('{"data":{"address":"6adfb2d2cb94ed7ffd946f4a069c6477f4e31045a5762c84017e5e1b984c714ce89dea83b23fd6c4c097aa72df79a137b4dbdba913334bb6dec84f4f5823ae7c","outputs":[{"amount":10000000000,"match":false,"output_idx":0,"output_pubkey":"08e84419b8fc122795fd93af6706677ad96bfa562e82aa6ea416a3a483a86605"},{"amount":70000000000,"match":false,"output_idx":1,"output_pubkey":"765383137d77847e2565bbcc59e10bfeafbe2c16e13b55e00c82db76cc632838"},{"amount":300000000000,"match":false,"output_idx":2,"output_pubkey":"03a945dd210b1420f7c49ae8a96afab25a44e0568bb670249976ea6ab3d62d8f"},{"amount":700000000000,"match":false,"output_idx":3,"output_pubkey":"4b39d84508723ab02a5865016120e103941e9fd2a6601b4cc781af76ef93fe16"},{"amount":2000000000000,"match":false,"output_idx":4,"output_pubkey":"386b13daad771021f503003e454a8b1c7cc3ffbbb6dbcc92d78ceebd2ae7a385"},{"amount":7000000000000,"match":false,"output_idx":5,"output_pubkey":"2c3e79a1a6bfcebfe347dff499800695c0cb6ee4ccb219e3201849ca8a2d9005"}],"tx_hash":"a5e50d89d4261036faf3d6d32f321e71ec8d810c64f268f321a3fe0cf8ee7968","tx_prove":false,"viewkey":"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d"},"status":"success"}');
		});
		app.config.onionMoneroBlockchainExplorer.testnet = ['http://localhost:' + port];
	});

	after(function() {
		server.close();
		app.config.onionMoneroBlockchainExplorer.testnet = [];
	});

	it('returns matching transaction outputs', function(done) {

		var params = {
			network: 'testnet',
			txhash: 'a5e50d89d4261036faf3d6d32f321e71ec8d810c64f268f321a3fe0cf8ee7968',
			address: '9wDZ4yA7aqiNQfnFrKsKQPM4jHyYRcdHdP5d5FDGa12YDs7QBFPwXgyZuk9WnCfAdvAKRWk4psFsYXb55xYGHgxmF6cxpUj',
			viewkey: '52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d',
		};

		var fullUri = uri + '?' + querystring.stringify(params);

		client[verb](fullUri, function(error, data, status, headers) {

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
				expect(data.data.viewkey).to.be.equal(params.viewkey);
			} catch (error) {
				return done(error);
			}

			done();
		});
	});

});
