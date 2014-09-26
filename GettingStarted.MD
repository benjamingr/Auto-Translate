Getting started
---------------

This workflow assumes you've already got the code in one language and want to start translating it to a second language. 


First, install the project from npm:

    npm install auto-translator

Your HTML might have files that look like:

    <div> Hello World </div>

And your JavaScript files have content that looks like:

    var foo = "Hello World";

Both of this need handling and a good translator should work for both. The first step would be to annotate your JS and HTML. Every time you need to translate an HTML string, wrap it like so:

    <div> <tr-translate name="greeting">Hello World</tr-translate></div>

Or similarly:

    var foo = translated("greeting", "Hello World");

After a build step, it is possible to remove the annotations completely, but in order for development to be easy - you can add a:

    function translated(x, y){
    	return y;
    }

Which would let you keep using your existing code which is the whole point - you get to keep working with your real code for as long as possible.

> Note: the tag names are configurable. For more information about using different tag or function names please see the readme.


Next, after you've converted your code you can extract the JSON from it:

    auto-translator  --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=en --dir=fileToJson

Or alternatively:

    node auto-translator.js  --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=en --dir=fileToJson

> Note: `auto-translator` keeps backups of your changed files from the last 3 days, you can find them in the `bak/` folder.

Your HTML/JS translations have all been extracted from the file to `yourjson.json`. You can now work on it, send it away to a translator and add another language. Now, let's say you want to see your site for example in German, rather than loading your `json` dynamically which would make a suboptimal dynamic experience - type: 

    auto-translator --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=de --dir=jsonToFile

Your HTML/JS file has now been populated with your German source, you can easily look at your source and update it directly, when you're done, move the german files back to the JSON. 


    auto-translator --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=de --dir=fileToJson

This way, you can easily work with multiple languages. When you deploy a language in a given site, select it and push it.
