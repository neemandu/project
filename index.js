// Import the Express module
var express = require('express');

//Import the logger module
var log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/gameLogger.log', category: 'gameLogger' },
    { type: 'file', filename: 'logs/winnersLogger.log', category: 'winnersLogger' },
    { type: 'file', filename: 'logs/offersLogger.log', category: 'offersLogger' },
    { type: 'file', filename: 'logs/transactionLogger.log', category: 'transactionLogger' },
    { type: 'file', filename: 'logs/connectionLogger.log', category: 'connectionLogger' }
  ]
});
var gameLogger = log4js.getLogger('gameLogger');
var winnersLogger = log4js.getLogger('winnersLogger');
var offersLogger = log4js.getLogger('offersLogger');
var transactionLogger = log4js.getLogger('transactionLogger');
var connectionLogger = log4js.getLogger('connectionLogger');

gameLogger.setLevel('TRACE');
winnersLogger.setLevel('TRACE');
offersLogger.setLevel('TRACE');
transactionLogger.setLevel('TRACE');
connectionLogger.setLevel('TRACE');
//logger.trace('Entering cheese testing');
//logger.debug('Got cheese.');
//actionsLogger.trace('Entering cheese testing');
//actionsLogger.debug('Got cheese.');
exports.gameLogger = gameLogger;
exports.winnersLogger = winnersLogger;
exports.offersLogger = offersLogger;
exports.transactionLogger = transactionLogger;
exports.connectionLogger = connectionLogger;

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Create a new instance of Express
var app = express();



// Import the Anagrammatix game file.
var agx = require('./agxgame');
var tester = require('./tester');
// Create a simple Express application
app.configure(function() {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname,'public')));
});

// Create a Node.js based http server on port 8010
var server = require('http').createServer(app).listen(8010);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);
//var testerIO = require('socket.io').listen(testerServer);

// Reduce the logging output of Socket.IO
io.set('log level',1);
//testerIO.set('log level',1);
// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
    //console.log('client connected');
    agx.initGame(io, socket);
});
var i =0;
var net = require('net');
var buffer = '';
var testerIO = net.createServer(function (c)
{ //'connection' listener
	console.log('Java client connected to this nodeServer');
    c.on('data', function (data)
    {
		i++;
	
		buffer += data.toString();
		
   
    	gameLogger.log('buffer: '+buffer);
		
		try{
			var s = JSON.parse(buffer);	
			var res = tester.initGame(s);
			console.log(res);
			c.write(res);
			c.pipe(c);
			console.log('data finished: '+i);
			
		}
		catch(e){
	
			console.log('data not finished: '+i);
		//	c.write('data not finished: '+i+'\r\n');
		//	c.pipe(c);
		}	
		//c.pipe(c);
    });
	
	c.on('error', function(err) {
			console.log('client disconnected');
		});
	
    c.on('end', function ()
    {
		buffer ='';
		console.log('nodeServer disconnected');

    });
});
testerIO.listen(8011, function ()
{ //'listening' listener
    console.log('nodeServer listening port:8011');
});


