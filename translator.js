
var FileTranslator = require("./FileTranslator.js");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");
var glob = Promise.promisify(require("glob"));

function main(){
	var args = parseArgs();
	if(!args.source || !args.json || !args.lang || !args.dir){
		console.log("Usage is `node translator.js " +
					"--source=FILESOURCE --json=T_FILESOURCE -lang=LANGUAGE" +
					" --dir=fileToJson|jsonToFile [--debug]");
		return;
	}

	args.source = args.args[0];
	args.json = args.args[1]
	args.lang = args.args[2];
	args.dir = args.args[3];

	if(args.dir !== "fileToJson" && args.dir !== "jsonToFile"){
		console.log("The direction argument (dir) must be either" +
					" fileToJson or jsonToFile", args.dir);
		return;
	}
	var formattingOptions = {};
	
	var translator = new FileTranslator(args.lang, args.json, args.source, formattingOptions);
	var action = ({
		"fileToJson":"toJson",
		"jsonToFile":"fromJson"
	})[args.dir];

	Promise.map([args.json, args.source], backupFilesBeforeOps.bind(null, args.lang)).error(function(err){
		console.error("Error backing up files, aborting");
		throw err;
	}).then(function(){
		return translator[action]();
	}).then(function(){
		return fs.unlinkSync(args.json+"."+args.lang);
	}).then(function(){
		console.log("Operation Completed Successfully");
	}).catch(function(err){
		console.error("Error performing translation operation");
		console.error("Error: ", err.message);
		if(args.debug) console.error(err);
	}).finally(function(){
		return cleanOldBakFiles();
	});
}

function parseArgs(){
	var program = require("commander");
	program.version('0.1.0')
	  .option('-s, --source', 'The source JS/HTML file')
	  .option('-j, --json', 'The JSON translation file')
	  .option('-l, --lang', 'The language to translate to')
	  .option('-x, --debug', 'Debug information')
	  .option('-d, --dir', 'What direction to translate fileToJson or jsonToFile')
	  .parse(process.argv);
	return program;
}

function backupFilesBeforeOps(lang, fName){
	return fs.statAsync("./bak/").error(function(){
		return fs.mkdirAsync("./bak/");
	}).then(function(){
		return fs.readFileAsync(fName);
	}).then(function(data){
		var fPath = "./bak/" + path.basename(fName)+"."+lang+"."+Date.now()+"."+fName.split(".").pop();
		return fs.writeFileAsync(fPath, data);
	});
}
function cleanOldBakFiles(){
	glob("./bak/*.*").map(function(file){
		return Promise.all([file, fs.statAsync(file)]);
	}).map(function(results){
		var fName = results[0], stat = results[1];
		var createTime = stat.ctime.getTime();
		var msInDay = 86400 * 1000;
		var threeDaysAgo = msInDay * 3;
		if(createTime < threeDaysAgo){
			return fs.unlinkSync(fName);
		}
	});
}

main();
