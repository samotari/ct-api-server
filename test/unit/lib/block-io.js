'use strict';

var _ = require('underscore');

var expect = require('chai').expect;
var manager = require('../../manager');
var app = manager.app();

describe('BlockIO', function() {

	var instance;
	before(function() {
		instance = new app.lib.BlockIO();
	});

	describe('convertToSatoshis(amount)', function() {
		it('should transform the amount received to satoshis', function() {
			var amountReceived = 1.0000;
			var amountInSatoshis = instance.convertToSatoshis(amountReceived);
			expect(amountInSatoshis).to.equal(100000000);
		})
	})

});
