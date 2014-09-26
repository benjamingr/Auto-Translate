
var LanguageManager = require("../LanguageManager.js");
var assert = require("assert");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

function formatAsEscodegen(js){
	return escodegen.generate(esprima.parse(js));
}

describe("importing JSON into a JS file", function(){
	var t;
	beforeEach(function(){
		t = new LanguageManager();
	});

	it("compiles", function(){
		t;
	});

	it("requires loading data", function(){
		assert.throws(function(){
			t.fileResult("./test-data/empty.js")
		});
	});

	it("forbids loading data twice", function(){
		t.loadStatic({a:"B"});
		assert.throws(function(){
			t.loadStatic({b:"C"});
		});
	});

	it("forbids loading async twice", function(){
		t.loadStatic({a:"B"});
		return t.loadFromFile("fake.json").then(function(){
			throw new Error("load twice");
		}, function(){
			// pass
		});
	});


	it("translates an empty js file correctly", function(){
		t.loadStatic({"hello":"world"});
		return t.fileResult("./test-data/empty.js").then(function(res){
			assert(res.type === "js");
			assert.equal(res.data.length, 0);
			assert(res.misses.length === 0)
		});
	});

	it("translates an html file correctly", function(){
		t.loadStatic({"hello":"goodbye"});
		var p = fs.readFileAsync("./test-data/testbasic.swapped.html");
		return t.fileResult("./test-data/testbasic.html").then(function(res){
			assert(res.type === "html");
			assert.equal(res.misses.length, 0)
			return Promise.all([res.data, p.then(function(x){ return x.toString();})]);
		}).spread(function(result, data){
			assert.equal(result, data);
		});
	});

	describe("missing", function(){
		var p = fs.readFileAsync("./test-data/testbasic.html");

		it("logs misses on an html file correctly (no key)", function(){
			t.loadStatic({});
			return t.fileResult("./test-data/testbasic.html").then(function(res){
				assert(res.type === "html");
				assert.equal(res.misses.length, 1)
				assert.equal(res.misses[0],'hello');
				return Promise.all([res.data, p.then(function(x){ return x.toString();})]);
			}).spread(function(result, data){
				assert.equal(result, data);
			});
		});

		it("logs misses on an html file correctly (key typo)", function(){
			t.loadStatic({"hella":"world"});
			return t.fileResult("./test-data/testbasic.html").then(function(res){
				assert(res.type === "html");
				assert.equal(res.misses.length, 1)
				assert.equal(res.misses[0],'hello');
				return Promise.all([res.data, p.then(function(x){ return x.toString();})]);
			}).spread(function(result, data){
				assert.equal(result, data);
			});
		});

		it("logs no misses on an html file replacing same word with same ", function(){
			t.loadStatic({"hello":"world"});
			return t.fileResult("./test-data/testbasic.html").then(function(res){
				assert(res.type === "html");
				assert.equal(res.misses.length, 0)
				return Promise.all([res.data, p.then(function(x){ return x.toString();})]);
			}).spread(function(result, data){
				assert.equal(result, data);
			});
		});

		it("logs no misses on an html file replacing same word with whitespace ", function(){
			t.loadStatic({"hello":" "});
			return t.fileResult("./test-data/testbasic.html").then(function(res){
				assert.equal(res.type, "html");
				assert.equal(res.misses.length, 0)
				return Promise.all([res.data, p.then(function(x){ return x.toString();})]);
			}).spread(function(result, data){
				data = data.replace('hello">world</tr-t', 'hello"> </tr-t');
				assert.equal(result, data);
			});
		});
	});
	describe("working on JS", function(){
		it("should detect JS", function(){
			t.loadStatic({hello: "world"})
			return t.fileResult("./test-data/stocksControllerManyTranslatedAfter.js").then(function(res){
				assert.equal(res.type, "js");
			});
		});

		it("should log misses", function(){
			t.loadStatic({});
			return t.fileResult("./test-data/stocksControllerManyTranslatedAfter.js").then(function(res){
				assert.equal(res.misses.length, 2);
			});
		});
		it("should log partial misses", function(){
			t.loadStatic({"seo-title": "foo"});
			return t.fileResult("./test-data/stocksControllerManyTranslatedAfter.js").then(function(res){
				assert.equal(res.misses.length, 1);
			});
		});

		it("should log no misses", function(){
			t.loadStatic({"seo-title": "foo", "seo-description": "bar"});
			return t.fileResult("./test-data/stocksControllerManyTranslatedAfter.js").then(function(res){
				assert.equal(res.misses.length, 0);
			});
		});

		it("logs no misses with correct type", function(){
			t.loadStatic({"seo-title": "bar", "seo-description": "baz"});
			return t.fileResult("./test-data/stocksControllerManyTranslatedAfter.js").then(function(res){
				assert.equal(res.misses.length, 0);
				assert.equal(res.type, "js");
			});
		});

		it("produces correct result", function(){
			t.loadStatic({"foo": "baz"});
			return t.fileResult("./test-data/simplejs.js").then(function(res){
				assert.equal(res.misses.length, 0);
				assert.equal(res.type, "js");
				assert.equal(res.data, "translated('foo', 'baz');")
			});
		});

		it("produces correct result with no replace and value", function(){
			t.loadStatic({});
			return t.fileResult("./test-data/simplejs.js").then(function(res){
				assert.equal(res.misses.length, 1);
				assert.equal(res.type, "js");
				assert.equal(res.data, "translated('foo', 'bar');")
			});
		});
	});
});