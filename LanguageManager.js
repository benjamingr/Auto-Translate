var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var JSTranslateHandler = require("./JSTranslateHandler.js");
var TagHandler = require("./TagHandler.js");

function LanguageManager(tagHandler, jsTranslateHandler){
	this.tagHandler = tagHandler || new TagHandler("tr-translate");
	this.jsTranslateHandler = jsTranslateHandler || new JSTranslateHandler("translated");

	this.loaded = false;
	this.loadedData = new Promise(function(resolve, reject){
		this._resolve = resolve
		this._reject = reject;
	}.bind(this)).bind(this);

	this._data = null;
};

LanguageManager.prototype.loadStatic = function(obj){
	if(this.loaded) throw new Error("Cannot load data twice");
	if(Object(obj) !== obj) throw new Error("loadStatic called with non object")
	this._data = obj;
	this._resolve(obj);
	this.loaded = true;
};

LanguageManager.prototype.loadFromFile = function load(jsonFile){
	if(this.loaded) return Promise.reject(Error("Cannot load data twice"));
	return fs.readFileAsync(jsonFile).then(function(file){
		this._data = JSON.parse(file.toString());
		this._resolve(this._data);
		this.loaded = true;
	}.bind(this))
};

LanguageManager.prototype.fileResult = function updateFile(fileName){
	if(!this.loaded) throw new Error("Please call load and wait for it before calling fileFromJson");
	var extn = fileName.split(".").pop();
	var strategy = ({
		"js": this.jsTranslateHandler,
		"html": this.tagHandler,
		"cshtml": this.tagHandler
	})[extn] || (function(){throw new Error("Unsupported file format to load from JSON" + extn);})();
	return fs.readFileAsync(fileName).then(function(buff){
		var asString = buff.toString();
		if(asString.length === 0) return {type:"js", data:"", misses:[]};
		return strategy.process(asString, this._data);
	}.bind(this))
};

module.exports = LanguageManager;