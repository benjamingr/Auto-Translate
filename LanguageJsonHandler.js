var Promise = require("bluebird");
Promise.longStackTraces();
var glob = Promise.promisify(require("glob"));
var cheerio = require("cheerio");
var fs = Promise.promisifyAll(require("fs"));



function LanguageJsonHandler(lang){
	if(!lang) throw new Error("Must take language");
	this.lang = lang;
	this.data = null;
}

LanguageJsonHandler.prototype.readLocalFile = function(fromFile) {
	return readJson(fromFile).then(function(obj){
		this.data = obj;
		return obj;
	}.bind(this));
};

// {"expert-buy":{"en":"Buy","he":"קנייה"}}

LanguageJsonHandler.prototype.readGlobalFile = function(fromFile) {
	return readJson(fromFile).then(function(obj){
		var data = {};
		Object.keys(obj).forEach(function(key){
			data[key] = obj[key][this.lang];
		}.bind(this));
		this.data = data;
		return this.data;
	}.bind(this));
};

LanguageJsonHandler.prototype.mergeIntoMultiLanguageJson = function(toFile) {
	if(!this.data) return Promise.reject(new Error("Trying to merge into global without data"));

	return readJson(toFile).then(function(multiLang){
		var allKeys = Object.keys(multiLang).concat(Object.keys(this.data));
		
		allKeys.forEach(function(key){
			var local = this.data[key]
			if(!local) {
				throw new Error("Found key: " + key + "that does not exist in translation");
			}
			if(typeof multiLang[key] !== "object" || multiLang[key] === null){
				multiLang[key] = {};
			}
			multiLang[key][this.lang] = local;

		}.bind(this));
		return fs.writeFileAsync(toFile, JSON.stringify(multiLang, 4, 4));
	}.bind(this));
};

LanguageJsonHandler.prototype.mergeIntoLocal = function(toFile) {
	if(!this.data) return Promise.reject(new Error("Trying to merge into local without data"));
	return fs.writeFileAsync(toFile, JSON.stringify(this.data));
};

function readJson(fromFile){
	return fs.readFileAsync(fromFile).then(function(buffer){
		return buffer.toString();
	}).then(JSON.parse);
}
module.exports = LanguageJsonHandler