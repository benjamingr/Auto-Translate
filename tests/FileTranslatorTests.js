
var FileTranslator = require("../FileTranslator.js");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var cheerio = require("cheerio");
var assert = require("assert");

var translationFile = "./test-data/temp.trans.json";
var translatedJs = "./test-data/tempfile.js";
var translatedHtml = "./test-data/tempfile.html";


describe("End to end translation", function(){
	
	it("translates js end to end", function(){
		return withJs("translated('Hello', 'World');", {"Hello":{"en":"Moshe"}}, function(){
			var t = new FileTranslator("en", translationFile, translatedJs);
			return t.fromJson().then(function(){
				return readFile(translatedJs);
			}).then(function(res){
				assert.equal(res, "translated('Hello', 'Moshe');");
			})
		});
	});
	it("translates de js end to end", function(){
		return withJs("translated('Hello', 'World');", {"Hello":{"de":"Moshe"}}, function(){
			var t = new FileTranslator("de", translationFile, translatedJs);
			return t.fromJson().then(function(){
				return readFile(translatedJs);
			}).then(function(res){
				assert.equal(res, "translated('Hello', 'Moshe');");
			})
		});
	});
	it("translates de from js to json", function(){
		return withJs("translated('Hello', 'World');", {"Hello":{"de":"Moshe"}}, function(){
			var t = new FileTranslator("de", translationFile, translatedJs);
			return t.toJson().then(function(){
				return readJson(translationFile);
			}).then(function(res){
				assert.equal(res.Hello.de, "World");
			})
		});
	});
	it("translates en from js to json", function(){
		return withJs("translated('Hello', 'World');", {"Hello":{"de":"Moshe",en:"Goog"}}, function(){
			var t = new FileTranslator("de", translationFile, translatedJs);
			return t.toJson().then(function(){
				return readJson(translationFile);
			}).then(function(res){
				assert.equal(res.Hello.de, "World");
				assert.equal(res.Hello.en, "Goog");
			})
		});
	});
	it("translates html end to end", function(){
		return withHtml('<tr-translate name="Hello">World</tr-translate>',
			{"Hello":{"en":"Moshe"}}, function(){
			var t = new FileTranslator("en", translationFile, translatedHtml);
			return t.fromJson().then(function(){
				return readFile(translatedHtml);
			}).then(function(res){
				assert.equal(res, '<tr-translate name="Hello">Moshe</tr-translate>');
			})
		});
	});
	it("generates json from html end to end", function(){
		return withHtml('<tr-translate name="Hello">World</tr-translate>',
			{"Hello":{"en":"Moshe"}}, function(){
			var t = new FileTranslator("en", translationFile, translatedHtml);
			return t.toJson().then(function(){
				return readJson(translationFile);
			}).then(function(res){
				assert.equal(res.Hello.en, "World");
			})
		});
	});
});



function withJs(file, json, fn){
	var p1 = fs.writeFileAsync(translatedJs, file);
	var p2 = fs.writeFileAsync(translationFile, JSON.stringify(json));
	return Promise.join(p1, p2, fn).finally(function(){
		return Promise.map([translatedJs, translationFile], fs.unlinkSync.bind(fs));
	});
}
function withHtml(file, json, fn){
	var p1 = fs.writeFileAsync(translatedHtml, file);
	var p2 = fs.writeFileAsync(translationFile, JSON.stringify(json));
	return Promise.join(p1, p2, fn).finally(function(){
		return Promise.map([translatedHtml, translationFile],
		 fs.unlinkSync.bind(fs));
	});
}
function readFile(fromFile){
	return fs.readFileAsync(fromFile).
		   then(function(buffer){ 
		   	 return buffer.toString();
		   });
}
function readJson(fromFile){
	return readFile(fromFile).then(JSON.parse);
}