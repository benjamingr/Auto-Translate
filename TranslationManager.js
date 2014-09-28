var LanguageManager = require("./LanguageManager");

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));


function TranslationManager(formattingOptions){
	this.languageManager = new LanguageManager(); // sorry for no DI
	this.formattingOptions = formattingOptions; //
}

TranslationManager.prototype.jsonFromJS = function jsonFromJS(jsSource, jsonDest){

	return this.languageManager.jsTranslateHandler.extractFile(jsSource).then(function(data){
		var obj = {};
		data.forEach(function(el){
			obj[el.name] = el.html;
		});
		return obj;
	}).then(function(toWrite){
		return fs.writeFileAsync(jsonDest, JSON.stringify(toWrite));
	});
};

TranslationManager.prototype.jsonFromHTML = function jsonFromHTML(htmlSource, jsonDest){
	return this.languageManager.tagHandler.extractFromFile(htmlSource).then(function(data){
		var obj = {};
		data.forEach(function(el){
			obj[el.name] = el.html;
		});
		return obj;
	}).then(function(toWrite){
		return fs.writeFileAsync(jsonDest, JSON.stringify(toWrite));
	});
};


TranslationManager.prototype.htmlFromJson = function htmlFromJson(jsonSource, htmlSrc, htmlDest){
	console.log(jsonSource);
	return readJson(jsonSource).then(function(json){
		return this.languageManager.tagHandler.renamedFileAsHtml(htmlSrc, json);
	}.bind(this)).then(function(html){
		if(html.missing.length){
			console.log("Missed translations", html.missing.join(","));
			throw new Promise.OperationalError("Incorrect translation format");
		}
		return fs.writeFileAsync(htmlDest, html.html);
	});
};

TranslationManager.prototype.jsFromJSON = function jsFromJSON(jsonSource, jsSource, jsDest){

	var readJs = fs.readFileAsync(jsSource).then(function(el){ return el.toString(); });
	return Promise.all([readJson(jsonSource), readJs]).bind(this).spread(function(json, js){
		var translator = this.languageManager.jsTranslateHandler;
		console.log(js);
		var res = translator.importIntoJS(js, json, this.formattingOptions);
		if(res.misses.length){
			console.log("Missed translations", res.misses.join(","));
			throw new Promise.OperationalError("Incorrect translation format");
		}
		return fs.writeFileAsync(jsDest, res.js);
	});
};

function readJson(path){
	return fs.readFileAsync(path).
				  catch(function(e){
				  	  return fs.writeFileAsync(path,"{}").return({});
				  }).
				  then(function(el){ return el.toString(); }).
				  then(JSON.parse).catch(SyntaxError, function(){
				  	  return {}; // JSON syntax error -> empty object
				  });
}
module.exports = TranslationManager;