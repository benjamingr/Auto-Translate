var LanguageJsonHandler = require("../LanguageJsonHandler.js");

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");
var glob = Promise.promisify(require("glob"));
var defLocal = "./test-data/temp.loc.json";
var defGlobal = "./test-data/temp.glob.json";

describe("LanguageJsonHandler", function(){
	var t;
	beforeEach(function(){
		t = new LanguageJsonHandler("en");
	});
	it("throws on no lang", function(){
		assert.throws(function(){
			new LanguageJsonHandler();
		});
	});
	it("can read from a file", function(){
		return withTempObjects({"a":"b"}, {"a":{"en":"b", "de":"g"}}, function(){
			return t.readLocalFile(defLocal).then(function(data){
				assert.equal(data.a, "b");
			});
		});
	});
	it("can read from a global file", function(){
		return withTempObjects({"a":"b"}, {"a":{"en":"c", "de":"g"}}, function(){
			return t.readGlobalFile(defGlobal).then(function(data){
				assert.equal(data.a, "c");
			});
		});
	});
	it("can write to a local file", function(){
		return withTempObjects({"a":"b"}, {"a":{"en":"c", "de":"g"}}, function(){
			return t.readGlobalFile(defGlobal).then(function(data){
				return t.mergeIntoLocal(defLocal);
			}).then(function(){
				return readJson(defLocal);
			}).then(function(read){
				assert.equal(read.a, "c");
			});
		});
	});
	it("can write to a global file", function(){
		return withTempObjects({"a":"b"}, {"a":{"en":"c", "de":"g"}}, function(){
			return t.readLocalFile(defLocal).then(function(data){
				return t.mergeIntoMultiLanguageJson(defGlobal);
			}).then(function(){
				return readJson(defGlobal);
			}).then(function(read){
				assert.equal(read.a.en, "b");
			});
		});
	});
});

function withTempObjects(loc,glob, fn){
	var p1 = fs.writeFileAsync(defLocal, JSON.stringify(loc));
	var p2 = fs.writeFileAsync(defGlobal, JSON.stringify(glob));
	return Promise.join(p1, p2, fn).finally(function(){
		return Promise.map([defLocal,defGlobal], fs.unlinkSync.bind(fs));
	});
}

function readJson(fromFile){
	return fs.readFileAsync(fromFile).then(function(buffer){
		return buffer.toString();
	}).then(JSON.parse);
}