var TagHandler = require("../TagHandler.js");

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");

describe("the tag handler", function(){
	it("doesn't do much to empty html", function(){
		var extract = new TagHandler("foobar")
		assert(extract.extractFromHtml("").length === 0)
	});
	it("doesn't do much to an unsuspecting div", function(){
		var extract = new TagHandler("foobar")
		assert(extract.extractFromHtml("<div>blah</div>").length === 0)
	});
	it("extracts basic html with a name/html pair", function(){
		var extract = new TagHandler("test");
		var res = extract.extractFromHtml("<test name='foo'>bar</test>");
		assert(res.length === 1);
		res = res[0];
		assert(res.name === "foo");
		assert(res.html === "bar");
	});
	it("extracts basic html with multiple pairs", function (){
		var extract = new TagHandler("test");
		var res = extract.extractFromHtml("<test name='foo'>bar</test><test name='bar'>bar</test><test name='baz'>bar</test>");
		assert(res.length === 3);
		res = res[0];
		assert(res.name === "foo");
		assert(res.html === "bar");
	});
	it("does not care about duplicate names", function (){
		var extract = new TagHandler("test");
		var res = extract.extractFromHtml("<test name='foo'>bar</test><test name='foo'>bar</test><test name='foo'>bar</test>");
		assert(res.length === 3);
		res = res[0];
		assert(res.name === "foo");
		assert(res.html === "bar");
	});
	it("extracts nothing from a unrelated basic file", function(){
		var extract = new TagHandler("tr-translate");
		return extract.extractFromFile("./test-data/testbasic.clean.html").then(function(res){
			assert(res.length === 0);
		});
	});

	it("extracts nothing from a unrelated realistic file", function(){
		var extract = new TagHandler("tr-translate");
		return extract.extractFromFile("./test-data/teststocks_no_attrs.html").then(function(res){
			assert(res.length === 0);
		});
	});
	it("extracts something from a related file", function(){
		var extract = new TagHandler("tr-translate");
		return extract.extractFromFile("./test-data/testbasic.html").then(function(res){
			assert(res.length === 1);
			assert(res[0].name === "hello" && res[0].html === "world");
		});
	});
	it("unwraps nothing when nothing is there to unwrap", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("") === "")
	});

	it("unwraps nothing when irrelevant stuff is there to unwrap", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<div></div>") === "<div></div>")
	});

	it("unwraps nothing when more irrelevant stuff is there to unwrap", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<div><span>Hello</span></div>") === "<div><span>Hello</span></div>");
	});

	it("unwraps a basic tag", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo>Hello</foo>") === "Hello");
	});

	it("unwraps a basic tag with name", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo name='hi'>Hello</foo>") === "Hello");
	});

	it("unwraps several basic tags with name", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo name='hi'>Hello</foo> <foo name='hey'>World</foo>") === "Hello World");
	});

	it("unwraps tags with HTML", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo name='hi'><div>Hello</div></foo>") === "<div>Hello</div>");
	});

	it("unwraps tags with Angular style", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo name='hi'>{{Hello}}</foo>") === "{{Hello}}");
	});

	it("unwraps tags with Angular style _and_ HTML", function(){
		var extract = new TagHandler("foo");
		assert(extract.unwrapHtml("<foo name='hi'><div>{{Hello}}</div></foo>") === "<div>{{Hello}}</div>");
	});

	it("unwraps nothing in irrelevant simple file", function(){
		var extract = new TagHandler("tr-translate");
		var p1 = extract.unwrapFile("./test-data/testbasic.clean.html");
		var p2 = fs.readFileAsync("./test-data/testbasic.clean.html");
		return Promise.join(p1, p2, function(r1, r2){
			r2 = cheerio.load(r2).html();
			assert(r1 === r2);
		});
	});

	it("unwraps nothing irrelevant in a bigger file", function(){
		var extract = new TagHandler("tr-translate");
		var p1 = extract.unwrapFile("./test-data/teststocks_no_attrs.html");
		var p2 = fs.readFileAsync("./test-data/teststocks_no_attrs.html");
		return Promise.join(p1, p2, function(r1, r2){
			r2 = cheerio.load(r2).html();
			assert(r1 === r2);
		});
	});

	it("unwraps tag in a file", function(){
		var extract = new TagHandler("tr-translate");
		var p1 = extract.unwrapFile("./test-data/testbasic.html");
		var p2 = fs.readFileAsync("./test-data/testbasic.clean.html");
		return Promise.join(p1, p2, function(r1, r2){
			r2 = cheerio.load(r2).html();
			assert(r1 === r2);
		});
	});
});
