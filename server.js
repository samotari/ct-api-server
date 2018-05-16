'use strict';

var pkg = require('./package.json');

// Set the process title so that we can properly kill the process.
// Change hyphens ("-") to underscores ("_").
process.title = pkg.name.replace(/-/g, '_');

var express = require('express');
var app = module.exports = express();

app.config = require('./config');
app.lib = require('./lib');
app.queues = require('./queues')(app);
app.services = require('./services')(app);
app.providers = require('./providers')(app);
app.middleware = require('./middleware')(app);
app.controllers = require('./controllers')(app);

app.use(function(req, res, next) {
	// If we get to this middleware, then none of the controllers matched the route.
	// Respond with a 404 error.
	var error = new Error();
	error.status = 404;
	next(error);
});

app.use(function(error, req, res, next) {

	// Catches errors from middleware and controllers.

	if (error) {

		if (!error.status) {
			app.error(error);
			error.status = 500;
			error.message = null;
		}

		if (!error.message) {
			error.message = 'error-' + error.status;
		}

		return res.status(error.status).json({
			error: {
				status: error.status,
				message: error.message,
			}
		});
	}

	next();
});

app.log = function() {
	console.log.apply(console, arguments);
};

app.error = function(error) {
	if (!(error instanceof Error)) {
		error = new Error(error);
	}
	console.error(error.stack);
};

app.onStart(function(done) {
	app.server = app.listen(app.config.port, app.config.host, function() {
		app.log('Server listening at ' + app.config.host + ':' + app.config.port);
		done();
	});
	app.sockets = require('./sockets')(app);
});

app.queues.onStart.resume();
