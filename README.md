Angular-Auto-Translate
======================

Translating multiple languages in Angular through JSON seamlessly

We use this at TipRanks internally, anyone who wants to read the code have a go - but this is for internal use and we do not intend to provide support any external users. Pull requests will be entertained if accompanied by tests.

###What this does

This package is meant for processing multiple languages in Angular. Translation files are stored in JSON and the script uses esprima/escodegen or cheerio to swap the file content with the relevant translation.

Translating is hard and working with foreign JSON files isn't fun, especially when you need to debug how something looks in a foreign language and you end up going back and forth between JSON translations and HTML files.

This solves that problem. 

For example, you can take:

    var foo = translated("greeting","Hello!");
    
Run this with fileToJson and lang=en and get

    {"greeting":{"en": "Hello!"}

Then have a translator write the same text in German, getting

    {"greeting":{"en": "Hello!","de":"Hallo!"}

Now, if you want to build or debug the german version, you can run the code with the jsonToFile option and get:

    var foo = translated("greeting","Hallo!");

When you're done working on it, you can push it back to the json and load another version. This also has the advantage that translation is a build step and there is no performance overhead in having a translated site.

The HTML syntax is `<tr-translated="greeting">Hello</tr-translated>` and does the same thing. 

###Usage

Generating or updating the JSON from an HTML or JS file:

```
node translator.js  --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=en --dir=fileToJson
```

Updating the HTML or JS file with JSON

```
node translator.js  --source=YOURJSOrHTMLSourceFile --json=YOURJSON.json --lang=en --dir=jsonToFile
```


###Running tests
  
Run the tests using `mocha tests`. 


Users may use it under the MIT license.

###Support

You may open issues for support here but I'd rather have them at StackOverflow. 

###Contributing

Contributions are welcome.