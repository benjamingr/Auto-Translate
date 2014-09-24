var JSTranslateHandler = require("../JSTranslateHandler.js");

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");
var glob = Promise.promisify(require("glob"));
var esprima = require("esprima");
var escodegen = require("escodegen");

function formatAsEscodegen(js){
	return escodegen.generate(esprima.parse(js));
}
describe("importing JSON into a JS file", function(){
	var t;
	beforeEach(function(){
		t = new JSTranslateHandler("translated");
	});

	it("should not alter an empty file", function(){
		var res = t.importIntoJS("", {"hello": "foo"});
		assert(res.js === "");
	});

	it("should not return any missed translations on an empty file", function(){
		var res = t.importIntoJS("", {"hello": "foo"});
		assert(res.misses.length === 0);
	});


	it("should not alter the function translated(){} itself", function(){
		var res = t.importIntoJS("function translated (){\n}",{});
		assert(res.js === "function translated() {\n}")
	});
	it("should not alter an unrelated statement", function(){
		var res = t.importIntoJS("alert('hi');",{});
		assert(res.js === "alert('hi');")
	});

	it("should return missed translations that were not performed", function(){
		var res = t.importIntoJS("translated('hi', 'bar')",{});
		assert(res.misses.length === 1);
		assert(res.misses[0] === 'hi');
	});

	it("should not alter a subterm of the function name", function(){
		var res = t.importIntoJS("translat('hello', 'world');", {"hello": "foo"})
		assert(res.js === "translat('hello', 'world');")
	});

	it("should not alter a supterm of the function name", function(){
		var res = t.importIntoJS("translatedd('hello', 'world');", {"hello": "foo"})
		assert(res.js === "translatedd('hello', 'world');")
	});
	
	it("should replace a term from assignment", function(){
		var res = t.importIntoJS("var x = translated('hello', 'world');", {"hello": "foo"})
		assert(res.js === "var x = translated('hello', 'foo');")
	});


	it("should replace a term from multiassignment", function(){
		var res = t.importIntoJS("var y, x = translated('hello', 'world');", {"hello": "foo"})
		assert(res.js === "var y, x = translated('hello', 'foo');")
	});


	it("should replace a term from func arg", function(){
		var res = t.importIntoJS("foo(translated('hello', 'world'));", {"hello": "foo"})
		assert(res.js === "foo(translated('hello', 'foo'));")
	});


	it("should replace a term from func multi arg", function(){
		var res = t.importIntoJS("foo(a, translated('hello', 'world'));", {"hello": "foo"})
		assert(res.js === "foo(a, translated('hello', 'foo'));")
	});

	it("should replace a single translation from JSON", function(){
		var res = t.importIntoJS("translated('hello', 'world');", {"hello": "foo"})
		assert(res.js === "translated('hello', 'foo');")
	});
	it("should replace two translations from JSON", function(){
		var js = "foo(translated('a', 'b'), translated('c', 'd'));";
		var dict = {a:'a',c:'c'};
		var res = t.importIntoJS(js, dict);

		assert(res.misses.length === 0);
		assert(res.js === "foo(translated('a', 'a'), translated('c', 'c'));")
	});

	it("should not replace unrelated stuff in an Angular file", function(){
		return fs.readFileAsync("./test-data/stocksController.js").then(function(content){
			return formatAsEscodegen();
		}).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {});
			assert.equal(res.js, parsed.toString());
		});
	});

	it("should not replace a translation in an Angular file if not present", function(){
		var f = "./test-data/stocksControllerWithTranslated.js"
		return fs.readFileAsync(f).then(formatAsEscodegen).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {});
			assert.equal(res.js, parsed);
		});
	});

	it("should keep track of missed in an Angular file", function(){
		var f = "./test-data/stocksControllerWithTranslated.js"
		return fs.readFileAsync(f).then(formatAsEscodegen).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {});
			assert.equal(res.misses.length, 1);
		});
	});

	it("should replace a translation in an Angular file", function(){
		var f = "./test-data/stocksControllerWithTranslated.js"
		return fs.readFileAsync(f).then(formatAsEscodegen).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {"seo-title": "foo"});
			assert.notEqual(res.js, parsed);
		});
	});

	it("should replace several translations in Angular file", function(){
		var f = "./test-data/stocksControllerManyTranslated.js"
		return fs.readFileAsync(f).then(formatAsEscodegen).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {"seo-title": "foo", "seo-description" : "boo"});
			assert.notEqual(res.js, parsed);
			assert.equal(res.misses.length, 0);
		});
	});


	it("should replace correctly translations in Angular file", function(){
		var f = "./test-data/stocksControllerManyTranslated.js"
		var p = fs.readFileAsync("./test-data/stocksControllerManyTranslatedAfter.js");
		return fs.readFileAsync(f).then(formatAsEscodegen).then(function(parsed){
			var res = t.importIntoJS(parsed.toString(), {"seo-title": "bar", "seo-description" : "foo"});
			assert.notEqual(res.js, parsed);
			assert.equal(res.misses.length, 0);
			return Promise.props({"mine": res.js, "should": p});
		}).then(function(res){
			assert.equal(res.mine, res.should);
		});
	});

	it("should not replace in string", function(){
		var res = t.importIntoJS("alert(\"translated('foo','bar')\");", {"foo":"boo"});
		assert.equal(res.js,     "alert('translated(\\'foo\\',\\'bar\\')');");
		assert.equal(res.misses.length, 0);
	});

});