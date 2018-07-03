'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;
var express = require('express');

var manager = require('../../../manager');
var app = manager.app();

describe('socket.channel: get-monero-transactions?networkName=testnet', function() {

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

	var port = 3700;
	var server;
	before(function() {
		var tmpApp = express();
		server = tmpApp.listen(port, 'localhost');
		tmpApp.get('/api/transactions', function(req, res, next) {
			res.send('{"data":{"blocks":[{"age":"00:03:43","hash":"f18f47ba47941753d6dee85c73ea0f54a9f5e686442780f0c85938b9c6d0eb0e","height":1131819,"size":2910,"timestamp":1529941236,"timestamp_utc":"2018-06-25 15:40:36","txs":[{"coinbase":true,"extra":"017a4738e017e87caa0dbd181bd470b9ac973c0e633ddb1627aee9785953f09c0b0208000000f38a0624e1","mixin":0,"payment_id":"","payment_id8":"","rct_type":0,"tx_fee":0,"tx_hash":"caa4ebebf39882ffcc0cd084ab5ed8ddc7c51a99fcfabf7f9f63b77b5c720050","tx_size":95,"tx_version":2,"xmr_inputs":0,"xmr_outputs":7372317406167},{"coinbase":false,"extra":"02210045545e30c44b4345b355174df29b8f49f5d36e4e447a43108d9d2fd4346c39f2011838eb450fa2e06571e04b8d5865e7c6e696d792e31b3c437aac4e75147a8920","mixin":7,"payment_id":"45545e30c44b4345b355174df29b8f49f5d36e4e447a43108d9d2fd4346c39f2","payment_id8":"","rct_type":4,"tx_fee":884580000,"tx_hash":"d6d3fbe20b7f08403d203cc3ee66442ff36728bf40b0297c447ffd345187a0ea","tx_size":2815,"tx_version":2,"xmr_inputs":0,"xmr_outputs":0}]},{"age":"00:05:57","hash":"01477e9990af2a9be51565dc36dc508c0a37e615fc1b24f8705a26f1d336778b","height":1131818,"size":95,"timestamp":1529941102,"timestamp_utc":"2018-06-25 15:38:22","txs":[{"coinbase":true,"extra":"01192ff367099a97e825a688a7bfffbfffa52f50951df8c17b8c305cd71b7dc1910208000000f28a0624e1","mixin":0,"payment_id":"","payment_id8":"","rct_type":0,"tx_fee":0,"tx_hash":"ff178ab620d0b3fd16346ed7f89c0ba406a7b51e13196f4a2ab33f3229242f13","tx_size":95,"tx_version":2,"xmr_inputs":0,"xmr_outputs":7371446886086}]}],"current_height":1131820,"limit":25,"page":0,"total_page_no":45272},"status":"success"}');
		});
		tmpApp.get('/api/mempool', function(req, res, next) {
			res.send('{"data":{"limit":100000000,"page":0,"total_page_no":0,"txs":[{"coinbase":false,"extra":"0221004279257e0a20608e25dba8744949c9e1caff4fcdafc7d5362ecf14225f3d9031011c05ff649e988d765d16705033fc3c13cddde3b67df2d57690ec3a064d36f1e3","mixin":7,"payment_id":"4279257e0a20608e25dba8744949c9e1caff4fcdafc7d5362ecf14225f3d9031","payment_id8":"","rct_type":4,"timestamp":1529941432,"timestamp_utc":"2018-06-25 15:43:52","tx_fee":884580000,"tx_hash":"029e68db4fcbfaccd78c81f26e72d57a9e6c21411f2c384c8882e709e2ff05c3","tx_size":2812,"tx_version":2,"xmr_inputs":0,"xmr_outputs":0}],"txs_no":1},"status":"success"}');
		});
		app.config.onionMoneroBlockchainExplorer.testnet = ['http://localhost:' + port];
	});

	before(function() {
		app.sockets.startPollingMoneroTxs();
	});

	after(function() {
		server.close();
		app.config.onionMoneroBlockchainExplorer.testnet = [];
	});

	it('receive right data format', function(done) {

		var channel = 'get-monero-transactions?networkName=testnet';
		var receivedData;
		client.socket.on('data', function(data) {
			if (data && data.channel === channel) {
				receivedData = data.data;
			}
		});

		async.until(function() { return !!receivedData; }, function(next) {
			_.delay(next, 10);
		}, function(error) {

			if (error) {
				return done(error);
			}

			try {
				expect(receivedData).to.be.an('array');
				if (!_.isEmpty(receivedData)) {
					expect(receivedData[0]).to.have.property('coinbase');
					expect(receivedData[0]).to.have.property('extra');
					expect(receivedData[0]).to.have.property('mixin');
					expect(receivedData[0]).to.have.property('payment_id');
					expect(receivedData[0]).to.have.property('payment_id8');
					expect(receivedData[0]).to.have.property('rct_type');
					expect(receivedData[0]).to.have.property('tx_fee');
					expect(receivedData[0]).to.have.property('tx_hash');
					expect(receivedData[0]).to.have.property('tx_size');
					expect(receivedData[0]).to.have.property('tx_version');
					expect(receivedData[0]).to.have.property('xmr_inputs');
					expect(receivedData[0]).to.have.property('xmr_outputs');
				}
			} catch (error) {
				return done(error);
			}

			done();
		});

		client.subscribe(channel);
	});
});
