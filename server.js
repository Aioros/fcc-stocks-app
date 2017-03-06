'use strict';

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
require('dotenv').load();
var request = require('request');

var stocks = [];

app.use('/', express.static(process.cwd() + '/public'));

var getStockData = function(code) {
	return new Promise(function(resolve, reject) {
		var now = new Date();
		var startDate = (now.getFullYear() - 7) + "-" +
			('0' + (now.getMonth()+1)).substr(-2) + "-" +
			('0' + now.getDate()).substr(-2);
		var endDate = now.getFullYear() + "-" +
			('0' + (now.getMonth()+1)).substr(-2) + "-" +
			('0' + now.getDate()).substr(-2);
		request("https://www.quandl.com/api/v3/datasets/WIKI/"+code+".json?api_key="+process.env.QUANDL_KEY+
				"&start_date="+startDate+"&end_date="+endDate, function(err, res, body) {
			if (err) {
				return reject(err);
			}
			var response = JSON.parse(body);
			if (response.hasOwnProperty("quandl_error")) {
				return reject(response.quandl_error);
			}
			var dataset = response.dataset;
			dataset.data = dataset.data.map(el => [Date.parse(el[0]), el[11]]).reverse();
			resolve(dataset);
		});
	});
};

io.on('connection', function (socket) {
	// codici sbagliati
	stocks.forEach(function(code) {
		getStockData(code).then(function(dataset) {
			socket.emit("message", {add: dataset});
		});
	});
	
	socket.on('message', function (message) {
		if (message.hasOwnProperty("add") && stocks.indexOf(message.add.toLowerCase()) === -1) {
			getStockData(message.add.toLowerCase()).then(function(dataset) {
				io.sockets.emit("message", {add: dataset});
				stocks.push(message.add.toLowerCase());
			}).catch(console.error);
		} else if (message.hasOwnProperty("remove")) {
			io.sockets.emit("message", message);
			stocks = stocks.filter(el => el.toLowerCase() !== message.remove.toLowerCase());
		}
	});
});

var port = process.env.PORT || 8080;
server.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
