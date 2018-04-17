'use strict';

var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.xmrchain', function() {

	describe('getBlockExplorerUrl', function() {

		it('Retuns right URL for mainnet', function() {
			var uri = '/api/mempool';
			var network = 'mainnet';
			var url = app.services.xmrchain.getBlockExplorerUrl(uri, network);

			expect(url).to.be.a('string');
			expect(url).to.equals('https://' + app.services.xmrchain.hostname[network] + uri);
		});

		it('Retuns right URL for testnet', function() {
			var uri = '/api/mempool';
			var network = 'testnet';
			var url = app.services.xmrchain.getBlockExplorerUrl(uri, network);

			expect(url).to.be.a('string');
			expect(url).to.equals('https://' + app.services.xmrchain.hostname[network] + uri);
		});
	});
});
