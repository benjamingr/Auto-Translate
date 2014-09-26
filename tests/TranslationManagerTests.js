var TranslationManager = require("../TranslationManager.js");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");


describe("The translation manager",function(){
	var m;

	beforeEach(function	(){
		m = new TranslationManager();
	});

	it("extracts JSON translations from simple JS", function(){
		var req = m.jsonFromJS("./test-data/simplejs.js", "./test-data/jsonSimple.json");
		return req.then(function(){
			return fs.readFileAsync("./test-data/jsonSimple.json");
		}).then(function(res){
			return res.toString();
		}).then(JSON.parse).then(function(resp){
			assert(resp.foo === "bar");
		});
	});

	it("does not extract junk when it doesn't need to", function(){
		var req = m.jsonFromJS("./test-data/stocksController.js", "./test-data/junk.json");
		return req.then(function(){
			return fs.readFileAsync("./test-data/junk.json");
		}).then(function(res){
			return res.toString();
		}).then(JSON.parse).then(function(res){
			assert.equal(Object.keys(res).length, 0)
		});
	});

	it("extracts JSON translations from hard JS", function(){
		var req = m.jsonFromJS("./test-data/stocksControllerManyTranslatedAfter.js",
							   "./test-data/stockJson.json");
		return req.then(function(){
			return fs.readFileAsync("./test-data/stockJson.json");
		}).then(function(res){
			return res.toString();
		}).then(JSON.parse).then(function(resp){
			assert(resp["seo-title"] === "bar");
			assert(resp["seo-description"] === "foo");
		});
	});

	it("extracts JSON translations from simple HTML", function(){
		var req = m.jsonFromHTML("./test-data/testbasic.html", "./test-data/jsonTestBasic.json");
		return req.then(function(){
			return fs.readFileAsync("./test-data/jsonTestBasic.json");
		}).then(function(res){
			return res.toString();
		}).then(JSON.parse).then(function(resp){
			assert(resp.hello === "world");
			assert(Object.keys(resp).length === 1);
		});
	});

	it("extracts JSON translations from hard HTML", function(){
		var req = m.jsonFromHTML("./test-data/teststocks_attrs.html", "./test-data/teststocks_attrs.json");
		return req.then(function(){
			return fs.readFileAsync("./test-data/teststocks_attrs.json");
		}).then(function(res){
			return res.toString();
		}).then(JSON.parse).then(function(resp){
			assert(resp.hello === "Buy Recommendations");
			assert(Object.keys(resp).length === 1);
		});
	});

	it("creates js from json and js", function(){
		var js = "translated('foo', 'bar');";
		var j = '{"foo":"baz"}';
		var jsP = fs.writeFileAsync("./test-data/js1.js", js);
		var jP = fs.writeFileAsync("./test-data/j1.json", j);
		return Promise.join(jP, jsP, function(){
			return m.jsFromJSON("./test-data/j1.json", "./test-data/js1.js", "./test-data/js1.out.js");
		}).then(function(){
			return fs.readFileAsync("./test-data/js1.out.js");
		}).then(function(el){ return el.toString(); }).then(function(res){
			assert.equal(res, "translated('foo', 'baz');");
		})
	});

})