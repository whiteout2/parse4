// Parse x86 instruction reference webpage https://www.felixcloutier.com/x86/index.html
// in TypeScript and print out mnemonic, summary and link. As fast and simple as possible
import * as request from 'request';
import * as fs from 'fs';


/*
// Read html file
//var request = require('request');
request.get('https://www.felixcloutier.com/x86/index.html', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //console.log(body); // Print the web page.

        // Alas, this parser cannot traverse the DOM, only do a simple selection 
        var HTMLParser = require('node-html-parser');
        var root = HTMLParser.parse(body);
        //console.log(root.firstChild.structure);
        console.log(root.querySelector('td').text);
        //console.log(root.querySelector('td').trimRight());
        //console.log(root.querySelector('td').text);
        console.log(root.structuredText);

    }
}); // End: request.get()
*/


// Let's just use htmlparser2 
// Re-use code from our x86 vscode extension in nodeDependencies.ts
// It is fast and can traverse via callback, i.e. it is a SAX parser (event based)
// See: https://nl.wikipedia.org/wiki/Simple_API_for_XML
var mnemonic = 'AAA';
var summary = 'ASCII Adjust AL After Subtraction';
var link = './AAA.html';

var found_td = false;
var column = 1;
//var table = 0;

var logtext = '';


// Read html file
//fs.readFileSync('https://www.felixcloutier.com/x86/index.html', 'utf-8')
//request('http://google.com/doodle.png').pipe(fs.createWriteStream('doodle.png'))
//var html = '';
//var request = require('request');
//request('http://google.com/doodle.png').pipe(fs.createWriteStream('doodle.png'));
request.get('https://www.felixcloutier.com/x86/index.html', function (error, response, body) {
	if (!error && response.statusCode == 200) {
		// HELL: can't get body in a global var. 
		// It will lose its value once we go out of scope.
		// So we will have to do all parsing in this fuction
		// YESS: This function will run asynchronously. So when we are in getDepsInPackageJson()
		// for the first time, request.get() must first fetch the file. Then the parsing starts in
		// this callback. But we then are already out of getDepsInPackageJson() and deps will
		// still not be filled. All the shit is because we are doing this in a callback.
		// Things had to go wrong:
		// getDepsInPackageJson() gets called several times
		// request.get() uses a callback
		// htmlparser.Parser() uses a callback
		// The last two must only be done once in the constructor.
		// It is nice that type/javascript has all these anonymous functions but it quickly
		// becomes very confusing.
		// TODO: Must do this only once. deps needs to be filled only once.
		var html = body;
		//g_html = body;
		// Continue with your processing here.
		//var test = body;
		// CHECK: Write to Debug Console
		//console.log('error:', error); // Print the error if one occurred
		//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		//console.log('body:', body); // Print the HTML for the Google homepage.
        
        /*       
        // TEST: reading html and writing to file for use in previewHtml
		// OK works!
		var myExtDir = vscode.extensions.getExtension ("whiteout2.x86").extensionPath;
		//fs.writeFileSync('/Users/RG/Documents/comp/whiteout2/tree-view-sample-x86/x86/index.html', body);
        fs.writeFileSync(myExtDir + '/x86/index.html', body);
        */
        fs.writeFileSync('index.html', body);


		// TODO: Parse <a href></a> as some mnemonics are grouped together on one page
	
		// Parse html file
		// NOTE: fucks up with: (1)</td>
		var htmlparser = require("htmlparser2");
		var parser = new htmlparser.Parser({
			onopentag: function (name: string, attribs: { href: string; }) {
				if (name === "td") {  // && attribs.type === "text/javascript") {
					//console.log("TD! Hooray!");
					found_td = true;
				}
				if (name === "a" && found_td) {
					//console.log("link: ", attribs.href);
					link = attribs.href;
                    link = link.slice(2, link.length);
				}
				//if (name === "table") {
				//	table++;;
				//}
			},
			ontext: function (text: string) {
				//console.log("-->", text);
				if (found_td && column == 1) {
					//console.log("-->", text);
					mnemonic = text;
					column = 2;
				} else
				if (found_td && column == 2) {
					//console.log("-->", text);
					// kludge for (1)</td> and (2)</td>
					if (text.indexOf('(1)') != -1 ||
						text.indexOf('(2)') != -1) 
					{
						mnemonic += text;
					} else {
						summary = text;
                        column = 1;
                        
                        //console.log("mnemonic: ", mnemonic);
                        //console.log("summary: ", summary);
                        //console.log("link: ", link);
                        console.log(mnemonic);
                        console.log(summary);
                        console.log("");

                        logtext += mnemonic + '\n' + summary + '\n\n';

                        // Add found mnemonic-summary to array
						// HELL: The array gets never filled
						// It's like all variables are deleted once we go out of request.get() scope
						// NONO: It gets filled OK. You can see it in Debug with a breakpoint on deps.push()
						// It is just that we lose all variables once we go out of scope
                        /* 
                        var dep = new Dependency(mnemonic, summary, vscode.TreeItemCollapsibleState.None, {
							command: 'extension.openPackageOnNpm',
							title: '',
							arguments: [mnemonic, link]
						});
                        deps.push(dep); 
                        */
					}
				}
			},
			onclosetag: function (tagname: string) {
				if (tagname === "td") {
					//console.log("That's it?!");
					found_td = false;
				}
			}
		}, { decodeEntities: true });
		parser.write(html);
		parser.end();
		
		// End parse
		console.log("Parse end.");

		// Write log file
		// NOTE: Must do it here, not after request.get()
		// This stuff executes async in a callback
		fs.writeFileSync('log.txt', logtext);
	}
}); // End: request.get()


// NOTE: cannot do this here: logtext will still be empty at this point because
// the callback has just started
//fs.writeFileSync('log.txt', logtext);