var JSTranslateHandler = require("../JSTranslateHandler.js");
var assert = require("assert");
describe("JS translation", function(){
	var t;
	beforeEach(function(){
		t = new JSTranslateHandler("translated");
	})
	it("doesn't find anything in an empty response", function(){
		assert(t.extractJS("").length === 0)
	});
	it("doesn't find anything in a single statement response", function(){
		assert(t.extractJS("alert('hi');").length === 0)
	});
	it("doesn't find anything in a statements response", function(){
		assert(t.extractJS("alert('hi');var foo = 'bar';").length === 0)
	});

	it("Throws on malformed JS", function(){
		assert.throws(function(){
			t.extractJS("alert('hi');dsagfhkj123!@#;123");
		});
	});
	it("Throws on junk", function(){
		assert.throws(function(){
			t.extractJS("12q5wtvbdhrcdsagfhkj123!@#;123");
		});
	});
	it("doesn't touch the named function itself", function(){
		assert(t.extractJS("function translated(){}").length === 0);
	});
	it("doesn't touch sub-names of functions", function(){
		assert(t.extractJS("translatedFoo('H','H')").length === 0);
	});
	it("extracts something on basic case", function(){
		assert(t.extractJS("translated('H','H')").length === 1);
	});
	it("extracts correctly on basic case", function(){
		var d = t.extractJS("translated('H','H')")
		assert(d.length === 1);
		assert(d[0].name === "H");
		assert(d[0].html === "H");
	});
	it("extracts two values on basic case", function(){
		var d = t.extractJS("var a = translated('H','H'); var b = translated('A','A')")
		assert(d.length === 2);
		assert(d[0].name === "H");
		assert(d[0].html === "H");

		assert(d[1].name === "A");
		assert(d[1].html === "A");
	});
	it("extracts 10 values on basic case", function(){
		var code = [0,1,2,3,4,5,6,7,8,9].reduce(function(prev, cur){
			return prev + "var a"+cur+" = translated('A"+cur+"','A"+cur+"');\n"
		},"")
		var d = t.extractJS(code)
		assert(d.length === 10);
		for(var i = 0; i < 10; i++){
			assert((d[i].name === ("A"+i)) && (d[i].html === ("A"+i)))
		}
	});
	it("extracts nothing from an irrelevant file", function(){
		return t.extractFile("./test-data/basic.js").then(function(res){
			assert(res.length === 0);
		});
	});

	it("extracts something from a relevant file", function(){
		return t.extractFile("./test-data/basic2.js").then(function(res){
			assert(res.length === 1);
			assert(res[0].name === "a");
			assert(res[0].html === "a");
		});
	});
});





