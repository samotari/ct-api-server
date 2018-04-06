'use strict';

module.exports = function(app) {

	var _ = require('underscore');
	var async = require('async');

	var queues = {
		onStart: async.queue(function(task, next) {
			// On-start callbacks are asynchronous.
			task.fn(next);
		}, 1/* concurrency */),
		onReady: async.queue(function(task, next) {
			// On-ready callbacks are synchronous.
			task.fn();
			next();
		}, 1/* concurrency */),
		onExit: async.queue(function(task, next) {
			// On-exit callbacks are asynchronous.
			task.fn(next);
		}, 1/* concurrency */)
	};

	// Pause all queues.
	// This prevents execution of queued items until queue.resume() is called.
	_.invoke(queues, 'pause');

	// Add a function to the app context for each queue (to make it easier to add tasks).
	_.each(_.keys(queues), function(name) {
		app[name] = function(fn) {
			queues[name].push({ fn: fn });
		};
	});

	queues.onStart.drain = function() {
		// All on-start callbacks have been executed.
		// Resume the on-ready queue.
		queues.onReady.resume();
		queues.onStart = null;
		console.log('app started');
	};

	queues.onStart.error = function(error) {
		console.log(error);
	};

	process.on('SIGINT', function() {
		if (!(queues.onExit.length() > 0)) {
			// Nothing in the queue. Exit the process immediately.
			process.exit(0);
		} else {
			queues.onExit.drain = function() {
				// All on-exit callbacks have been executed.
				process.exit(0);
			};
			queues.onExit.resume();
		}
	});

	return queues;
};
