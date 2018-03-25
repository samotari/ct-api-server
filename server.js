'use strict';

var express = require('express');
var app = express();

app.config = require('./config');
app.services = require('./services')(app);
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
			console.error(error);
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

app.server = app.listen(app.config.port, app.config.host, function() {
	console.log('Server listening at ' + app.config.host + ':' + app.config.port);
});
