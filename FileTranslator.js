var LanguageJsonHandler = require("./LanguageJsonHandler.js");
var TranslationManager = require("./TranslationManager.js");
// main class


function FileTranslator(lang, langJson, fileToTranslate, formattingOptions){
	this.lang = lang;
	this.langJson = langJson;
	this.fileToTranslate = fileToTranslate;
	this.jsonHandler = new LanguageJsonHandler(this.lang);
	this.translationManager = new TranslationManager(formattingOptions);
}

FileTranslator.prototype.toJson = function() {
	var fileExtn = this.fileToTranslate.split(".").pop();
	var strategy = ({
	  "js": this.translationManager.jsonFromJS.bind(this.translationManager),
	  "html": this.translationManager.jsonFromHTML.bind(this.translationManager),
	  "cshtml": this.translationManager.jsonFromHTML.bind(this.translationManager)
	})[fileExtn] || (function(){ throw new Error("Invalid file format")})();
	var p = strategy(this.fileToTranslate, this.langJson+"."+this.lang)
	return p.then(function(){
		return this.jsonHandler.readLocalFile(this.langJson+"."+this.lang);
	}.bind(this)).then(function(){
		return this.jsonHandler.mergeIntoMultiLanguageJson(this.langJson);
	}.bind(this));
};

FileTranslator.prototype.fromJson = function(){
	var fileExtn = this.fileToTranslate.split(".").pop();
	var strategy = ({
	  "js": this.translationManager.jsFromJSON.bind(this.translationManager),
	  "html": this.translationManager.htmlFromJson.bind(this.translationManager),
	  "cshtml": this.translationManager.htmlFromJson.bind(this.translationManager)
	})[fileExtn] || (function(){ throw new Error("Invalid file format")})();
	return this.jsonHandler.readGlobalFile(this.langJson).then(function(){
		this.jsonHandler.mergeIntoLocal(this.langJson+"."+this.lang);
	}.bind(this)).then(function(){
		return strategy(this.langJson+"."+this.lang,
						this.fileToTranslate,
						this.fileToTranslate);
	}.bind(this));
};

module.exports = FileTranslator;
