'use strict';

module.exports = function(app) {

	app.use(function(req, res, next) {

		if (req.headers['access-control-request-method']) {
			res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
		}

		if (req.headers['access-control-request-headers']) {
			res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
		} else {
			res.header('Access-Control-Allow-Headers', 'Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Origin');
		}

		res.header('Access-Control-Allow-Origin', req.headers.origin);
		next();
	});
};
