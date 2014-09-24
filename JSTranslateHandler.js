var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var esprima = require("esprima");
var escodegen = require("escodegen");

function JSTranslateHandler(fnName){
	this.fnName = fnName || "translated";
}

JSTranslateHandler.prototype.extractJS = function extractJS(rawJS){
	var tree = esprima.parse(rawJS);
	var datas = [];
	ceVisitor(tree, function(el){
		if(el.callee.name !== this.fnName){ // named "translated"
			return;
		}
		datas.push({name: el.arguments[0].value, html: el.arguments[1].value});
	}.bind(this));
	return datas;
};

JSTranslateHandler.prototype.extractFile = function extractFile(fileName){
	return fs.readFileAsync(fileName).bind(this).then(function(content){
		return this.extractJS(content);
	});
};

JSTranslateHandler.prototype.importIntoJS = function(rawJS, dict, codeGenOptions){
	var tree = esprima.parse(rawJS);
	var misses = [];
	ceVisitor(tree, function(el){
		if(el.callee.name !== this.fnName){ // named "translated"
			return;
		}
		var value = dict[el.arguments[0].value];
		if(!value){
			return misses.push(el.arguments[0].value);
		}
		el.arguments[1].value = value; // update
	}.bind(this));
	return {
		js: escodegen.generate(tree, codeGenOptions),
		misses: misses
	};
}

// export interface
JSTranslateHandler.prototype.process = function process(){
	var res = JSTranslateHandler.prototype.importIntoJS.apply(this, arguments)
	return {type:"js", data: res.js, misses: res.misses};
}


module.exports = JSTranslateHandler

function ceVisitor(tree, visit){
	return visitor(tree, function(el){
		if(!el) return;
		if(el.type !== "CallExpression"){ // fn call
			return;
		}
		return visit(el);
	});
}

function visitor(tree,visit){
	for(var i in tree){
		visit(tree[i]);
		if(typeof tree[i] === "object" && tree[i] !== null){
			visitor(tree[i],visit);
		}
	}
}