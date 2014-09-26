
var Promise = require("bluebird");
Promise.longStackTraces();
var glob = Promise.promisify(require("glob"));
var cheerio = require("cheerio");
var fs = Promise.promisifyAll(require("fs"));

function TagHandler(tagName){
	this.tagName = tagName || "tr-translate";
}

TagHandler.prototype.extractFromFile = function extractFromFile(filePath){
	return fs.readFileAsync(filePath).bind(this).then(function(content){
		return this.extractFromHtml(content);
	});
};
TagHandler.prototype.unwrapFile = function unwrapHtml(filePath){
	return fs.readFileAsync(filePath).bind(this).then(function(content){
		return this.unwrapHtml(content);
	});
};


TagHandler.prototype.unwrapHtml = function unwrapHtml(rawHtml){
	var $ = cheerio.load(rawHtml);
	var tags = $(this.tagName).get();
	tags.map(function(tag){
		return $(tag);
	}).forEach(function($tag){
		$tag.replaceWith($tag.html());
	});
	return $.html()
};

TagHandler.prototype.extractFromHtml = function extractFromHtml(rawHtml){
	var $ = cheerio.load(rawHtml);
	var tags = $(this.tagName).get();
	return tags.map(function(tag){
		var $tag = $(tag)
		var content = $tag.html();
		if($tag.attr("selector")){
			content = $($tag.attr("selector")).attr($tag.attr("attr-name"))
		}
		return { name: $tag.attr("name"), html: content };
	});
};

TagHandler.prototype.renamedHtml = function renamedHtml(rawHtml, translation, codeGenOptions){
	if(Object(translation) !== translation) throw Error("Tranalation param must be an object");

	var $ = cheerio.load(rawHtml);
	var tags = $(this.tagName).get();
	var missing = [];
	tags.forEach(function(tag){
		var $tag = $(tag);
		var value = translation[$tag.attr('name')];
		if(!value){
			missing.push($tag.attr("name"));
		} else {
			$tag.html(value);
		}
	});
	return {html: $.html(), missing: missing};
};

TagHandler.prototype.renamedFileAsHtml = function renamedFileAsHtml(filePath, translation){
	return fs.readFileAsync(filePath).bind(this).then(function(content){
		return this.renamedHtml(content, translation);
	});
};
TagHandler.prototype.swapLangInFile = function swapLangInFile(filePath, translation){
	var bak = filePath+"."+Date.now()+".langbak";
	return fs.readFileAsync(filePath).bind(this).then(function(content){
		return Promise.all([
			this.renamedHtml(content, translation),
			fs.writeFileAsync(bak, content), // backup
		]);
	}).spread(function(replacedContent, _){
		if(replacedContent.missing.length){
			var err = new Error("Could not update file");
			err.isAsync = true;
			return fs.renameAsync(bak, filePath). // restore
			throw(err);
		} 
		return fs.writeFileAsync(filePath, replacedContent.html).return(replacedContent);
	});
};

// export interface
TagHandler.prototype.process = TagHandler.prototype.renamedHtml


TagHandler.prototype.process = function process(){
	var obj = TagHandler.prototype.renamedHtml.apply(this, arguments)
	return {type:"html", data: obj.html, misses: obj.missing};
};


module.exports = TagHandler