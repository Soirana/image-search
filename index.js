var express = require('express');
var fs = require('fs');
var Datastore = require('nedb');
var fetch = require('request');

var app = express();
var html = fs.readFileSync('index.html');
var db = new Datastore({ filename: 'links.db', autoload: true });
app.set('port', (process.env.PORT || 5000));
var searchId = ENV['IMGUR_KEY'];//assign key here

app.get('/', function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end(html);
	});

app.get('/latest/search', function(request, response) {
	var searchURL = 'https://api.imgur.com/3/gallery/search/viral/1?q=random';
		db.find({}, function (err, docs) {

				db.count({}, function (err, count) {
					if (count>50) {
						db.remove({}, { multi: true }, function (err, numRemoved) {
						});
					}
				});
			for (var i = 0; i < docs.length; i++) {
				delete docs[i]["_id"]
			}
			response.json(docs);
		});
});

app.get('/*', function(request, response) {
	var stringa = request.params[0];
	var pages = Math.max (1, request.query.offset || 1);
	var searchURL = 'https://api.imgur.com/3/gallery/search/viral/'+pages+'?q='+stringa;
	var	options = {
			headers: {
				'Authorization': 'Client-ID ' + searchId}};
	fetch(searchURL, options, function(error, resp, body) {
		if (error) {
			response.json({"error": error});
		}
		if(!error && resp.statusCode == 200){
			var linksMess = JSON.parse(body).data;
			if (linksMess.length === 0) {
				response.json({"error": "page seems to be empty"});	
			} else{
			var links = [];
			for (var i = 0; i < linksMess.length; i++) {
			links.push ({
				url : linksMess[i].link,
				title :linksMess[i].title
			})
			}
			var currentDate = new Date();
			var datetime = currentDate.getDate() + "/"
                + (currentDate.getMonth()+1)  + "/" 
                + currentDate.getFullYear() + " - "  
                + currentDate.getHours() + ":"  
                + currentDate.getMinutes() + ":" 
                + currentDate.getSeconds();
			db.insert({search: stringa, page : pages, when: datetime});
			response.json(links);
			}
		} 
});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

