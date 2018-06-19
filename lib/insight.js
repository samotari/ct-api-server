'use strict';

var _ = require('underscore');
var SocketIOClient = require('socket.io-client');

var Insight = module.exports = function(config) {
	this.config = config;
	this.name = _.uniqueId('insight');
};

Insight.prototype.close = function() {
	if (this.socket) {
		this.socket.close();
		this.socket = null;
	}
};

Insight.prototype.connect = function(cb) {
	var done = cb && _.once(cb) || _.noop;
	var socket = SocketIOClient(this.config.baseUrl);
	socket.once('connect', function() {
		done();
	});
	socket.once('error', function(error) {
		done(error)
	});
	this.socket = socket;
};
