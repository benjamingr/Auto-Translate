var TagHandler = require("../TagHandler.js");

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");
var glob = Promise.promisify(require("glob"));

describe("Tag handler html replacements", function(){
	var t;
	beforeEach(function(){
		t = new TagHandler("tr-translate");
	})
	it("throws on no translation", function(){
		assert.throws(function(){
			t.renamedHtml("<div></div>");
		});
	});

	it("doesn't affect empty html & translation", function(){
		assert("" === t.renamedHtml("", {}).html);
	});

	it("doesn't affect empty html", function(){
		assert("" === t.renamedHtml("", {"foo":"bar"}).html);
	});

	it("doesn't affect empty translation", function(){
		assert("<div></div>" === t.renamedHtml("<div></div>", []).html);
	});

	it("doesn't log anything missing on an empty translation", function(){
		assert(t.renamedHtml("<div></div>", {}).missing.length === 0);
	});
	it("ignores missing json translations", function(){
		assert(t.renamedHtml("<div></div>", {"foo":"bar"}).missing.length === 0);
	});
	it("replaces a translation", function(){
		var html = '<tr-translate name="foo">bar</tr-translate>';
		var translations = {foo:"baz"};
		var res = t.renamedHtml(html, translations);

		assert(res.missing.length === 0);
		assert(res.html === '<tr-translate name="foo">baz</tr-translate>');
	});
	it("replaces two translations", function(){
		var html = '<tr-translate name="foo">bar</tr-translate><tr-translate name="bar">bak</tr-translate>';
		var translations = {foo:"baz",bar:"ban"};
		var res = t.renamedHtml(html, translations);

		assert(res.missing.length === 0);
		assert(res.html === '<tr-translate name="foo">baz</tr-translate><tr-translate name="bar">ban</tr-translate>');
	});
	it("replaces html", function(){
		var html = '<tr-translate name="foo"><div>Hello</div></tr-translate>';
		var translations = {foo:"<span>World</span>"};
		var res = t.renamedHtml(html, translations);

		assert(res.missing.length === 0);
		assert(res.html === '<tr-translate name="foo"><span>World</span></tr-translate>');
	});
	it("reports missing translations", function(){
		var html = '<tr-translate name="foo"><div>Hello</div></tr-translate><tr-translate name="asd"></tr-translate>';
		var translations = {foo:"<span>World</span>"};
		var res = t.renamedHtml(html, translations);
		assert(res.missing.length === 1);
		assert(res.html === '<tr-translate name="foo"><span>World</span></tr-translate><tr-translate name="asd"></tr-translate>');
	});
	it("reports missing translations names", function(){
		var html = '<tr-translate name="foo"><div>Hello</div></tr-translate><tr-translate name="asd"></tr-translate>';
		var translations = {foo:"<span>World</span>"};
		var res = t.renamedHtml(html, translations);
		assert(res.missing.length === 1);
		assert(res.missing[0] === "asd");
	});
	it("replaces from file", function(){
		var file = t.renamedFileAsHtml("./test-data/testbasic.html",{"hello":	"worldz"});
		return file.then(function(res){
			assert(res.missing.length === 0);
			assert(cheerio.load(res.html)("tr-translate").text().trim() === "worldz");
		});
	});
	it("logs errors on file", function(){
		var file = t.renamedFileAsHtml("./test-data/testbasic.html",{"asd":	"worldz"});
		return file.then(function(res){
			assert(res.missing.length === 1);
		});
	});
	it("replaces nothing if irrelevant keys", function(){
		var file = t.renamedFileAsHtml("./test-data/testbasic.html",{"asd":	"worldz"});
		return file.then(function(res){
			assert(res.missing.length === 1);
			assert(cheerio.load(res.html)("tr-translate").text().trim() === "world");
		});
	});

	it("swaps in a real file", function(){
		return t.renamedFileAsHtml("./test-data/teststocks_attrs.html", {"hello": "bar"}).
			get("html").then(function(html){
				assert(cheerio.load(html)("tr-translate").text().trim() === "bar")
			});
	});

	it("swaps multiple words in a real file", function(){
		return t.renamedFileAsHtml("./test-data/teststocks_attrs.html", {"hello": "buy recs"}).
			get("html").then(function(html){
				assert(cheerio.load(html)("tr-translate").text().trim() === "buy recs")
			});
	});


	it("swaps html in a real file", function(){
		return t.renamedFileAsHtml("./test-data/teststocks_attrs.html", {"hello": "<span>Hello</span>"}).
			get("html").then(function(html){
				assert(cheerio.load(html)("tr-translate").html().trim() === "<span>Hello</span>")
			});
	})

	it("replaces nothing if irrelevant keys", function(){
		var file = t.renamedFileAsHtml("./test-data/testbasic.html",{"asd":	"worldz"});
		return file.then(function(res){
			assert(res.missing.length === 1);
			assert(cheerio.load(res.html)("tr-translate").text().trim() === "world");
		});
	});
	it("swaps real files", function(){
		var path = "./test-data/swapMe";
		return Promise.try(function(){
			return fs.unlinkAsync(path);
		}).then(function(){
			return fs.writeFileAsync(path,'<tr-translate name="foo">bar</tr-translate>');
		}).then(function(){
			return t.swapLangInFile(path,{"foo":"foo"});
		}).then(function(){
			return fs.readFileAsync(path);
		}).then(function(content){
			content = content.toString();
			assert(content === '<tr-translate name="foo">foo</tr-translate>');
		}).finally(function(){
			return glob("./test-data/*.langbak")
			.map(fs.unlinkSync.bind(fs));
		});
	});
	
	it("does not swap on missing property", function(){
		var path = "./test-data/swapMe";
		return Promise.try(function(){
			return fs.unlinkAsync(path);
		}).then(function(){
			var html = '<tr-translate name="foo">bar</tr-translate><tr-translate name="bar">baz</tr-translate>'
			return fs.writeFileAsync(path,html);
		}).then(function(){
			return t.swapLangInFile(path,{"foo":"foo"});
		}).then(function(){
			throw new Error("Failed replace backup")
		}, function(err){
			assert(err.isAsync)
		});
	});

});