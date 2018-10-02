'use strict';

module.exports = function(app) {

	var bodyParser = require('body-parser');

	var parsers = {
		'urlencoded': bodyParser.urlencoded({
			extended: true
		}),
		'json': bodyParser.json()
	};

	app.use(function(req, res, next) {

		parsers.urlencoded(req, res, function(error) {

			if (error) {
				return next(error);
			}

			parsers.json(req, res, function(error) {

				if (error) {
					error = new Error('invalid json');
					error.status = 400;
					return next(error);
				}

				next();
			});
		});
	});
};
