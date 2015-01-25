// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/asset'));

devices = [{"name":"Motion"},{"name":"Temp"}, {"name":"Humidity"}];

// var PythonShell = require('python-shell');

// var options = {
//   scriptPath: '/home/pi/final/python/'
// };

io.on('connection', function (socket) {
	socket.on('auth', function (data) {
		socket.emit('authentication', true);
	})
})

