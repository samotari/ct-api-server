'use strict';

var _ = require('underscore');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var manager = require('../../manager');
var app = manager.app();

describe('sockets', function() {

	describe('savePrimusClientLibraryToFile(filePath, cb)', function() {

		var filePath = path.join(__dirname, '..', '..', 'tmp', 'primus', 'primus.js');
		after(function(done) {
			fs.unlink(filePath, done);
		});

		it('should write the primus.js library to the given file path', function(done) {
			app.sockets.savePrimusClientLibraryToFile(filePath, function(error) {
				if (error) return done(error);
				fs.readFile(filePath, function(error, buffer) {
					if (error) return done(error);
					try {
						expect(buffer.toString().indexOf('Primus')).to.not.equal(-1);
					} catch (error) {
						return done(error);
					}
					done();
				});
			});
		});
	});
});
