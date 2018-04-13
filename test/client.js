'use strict';

var _ = require('underscore');
var request = require('request');
var stream = require('stream');

var Client = module.exports = function(options) {

	this.options = options || {};
};

Client.prototype.get = function(uri, data, cb) {

	return this.request('GET', uri, data, cb);
};

Client.prototype.post = function(uri, data, cb) {

	return this.request('POST', uri, data, cb);
};

Client.prototype.put = function(uri, data, cb) {

	return this.request('PUT', uri, data, cb);
};

Client.prototype.delete = function(uri, data, cb) {

	return this.request('DELETE', uri, data, cb);
};

Client.prototype.request = function(method, uri, data, cb) {

	if (_.isFunction(data)) {
		cb = data;
		data = null;
	}

	method = method.toString().toUpperCase();

	var options = {
		uri: 'http://' + this.options.host + ':' + this.options.port + uri,
		method: method,
		headers: {},
	};

	if (this.options.requestOptions) {
		options = _.extend({}, options, _.omit(this.options.requestOptions, 'uri', 'method'));
	}

	if (data) {
		if (['GET', 'DELETE'].indexOf(method) !== -1) {
			options.qs = data;
		} else if (['POST', 'PUT'].indexOf(method) !== -1) {

			var containsStreams = _.some(data, function(value) {
				return value instanceof stream.Readable;
			});

			if (containsStreams) {
				// multipart/form-data
				options.formData = data;
			} else {

				if (uri.substr(0, '/api'.length) === '/api' && !options.headers['Accept']) {
					// Default "Accept: application/json" for API end-points.
					options.headers['Accept'] = 'application/json';
				}

				// application/x-www-form-urlencoded'
				options.form = data;
			}
		}
	}

	if (this.options.userAgent) {
		options.headers['User-Agent'] = this.options.userAgent;
	}

	return request(options, function(error, response, data) {

		if (error) {
			return cb(error);
		}

		if (
			response.headers['content-type'] &&
			response.headers['content-type'].indexOf('application/json') !== -1
		) {
			try {
				data = JSON.parse(data);
			} catch (error) {
				return cb(error);
			}
		}

		cb(null, data, response.statusCode, response.headers);
	});
};

Client.prototype.GET = Client.prototype.get;
Client.prototype.POST = Client.prototype.post;
Client.prototype.PUT = Client.prototype.put;
Client.prototype.DELETE = Client.prototype.delete;
