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
		var instances = _.filter(app.services.insight.instances, function(instance) {
			return instance.method === 'bitcoin';
		});

		_.each(instances, function(instance) {

			it(instance.method, function(done) {

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
					} catch (error) {
						return done(error);
					}

					done();
				});
			});
		});
	});
});
