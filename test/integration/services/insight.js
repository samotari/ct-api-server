'use strict';

var _ = require('underscore');
var async = require('async');
var expect = require('chai').expect;

var manager = require('../../manager');
var app = manager.app();

describe('services.insight', function() {

	describe('new transactions', function() {

		var subscriptions = [];
		after(function() {
			_.each(subscriptions, function(subscription) {
				subscription.instance.unsubscribe(subscription.id);
			});
			subscriptions = [];
		});

		// Only test bitcoin because it's the most likely to have new transactions, quickly.
		var method = 'bitcoin';
		var instance;
		before(function() {
			instance = _.first(app.services.insight.instances[method]);
		});

		it(method, function(done) {

			var receivedData;
			var subscriptionId = instance.subscribe('inv/tx', function(data) {
				receivedData = data;
			});

			subscriptions.push({
				instance: instance,
				id: subscriptionId,
			});

			expect(subscriptionId).to.be.a('string');

			async.until(function() { return !!receivedData; }, function(next) {
				_.delay(next, 10);
			}, function(error) {

				if (error) {
					return done(error);
				}

				try {
					expect(receivedData).to.be.an('object');
					expect(receivedData.txid).to.be.a('string');
					expect(receivedData.vout).to.be.an('array');
					_.each(receivedData.vout, function(vout) {
						expect(vout).to.be.an('object');
						var addresses = _.keys(vout);
						_.each(addresses, function(address) {
							expect(address).to.be.a('string');
						});
						var amounts = _.values(vout);
						_.each(amounts, function(amount) {
							expect(amount).to.be.a('number');
						});
					});
				} catch (error) {
					return done(error);
				}

				done();
			});
		});
	});
});
