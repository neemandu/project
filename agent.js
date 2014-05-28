var net = require('net');

var gameId;

var joinData = {
	"Type" : "Agent",
	
 	"Action" : "joinGame",
	
	"ID" : 7,
	
	"listening_port" : 6060,
	
	"IP" : '127.0.0.1'
	};

var moveData = {
	"Type" : "Agent",
	
 	"Action" : "moveDown",
	
	"ID" : 7,
	
	"gameId" : gameId
	
	
	};
	
var offerData = {
	"Type" : "Agent",
	
 	"Action" : "joinGame",
	
	"ID" : 0,
	
	"gameId" : gameId
	};
	
var transferData = {
	"Type" : "Agent",
	
 	"Action" : "joinGame",
	
	"ID" : 0,
	
	"gameId" : gameId
	};
	
var acceptData = {
	"Type" : "Agent",
	
 	"Action" : "acceptData",
	
	"ID" : 0,

	"gameId" : gameId

	};
	
var rejectData = {
	"Type" : "Agent",
	
 	"Action" : "rejectOffer",
	
	"ID" : 0,
	
	"offerID" : 2,
	
	"gameId" : gameId
	
	};
	

	
var i=1;
var testerIO = net.createServer(function (c)
{ //'connection' listener
	console.log('Java client connected to this nodeServer');
    c.on('data', function (data)
    {
		var conf = JSON.parse(data);
    	console.log(conf);
		
    	//c.write(res);
    	//c.pipe(c);
		if(i === 3){
			write(moveData);
		}
		gameId = conf.gameId;
		console.log(gameId);
		moveData.gameId = conf.gameId;
		console.log(moveData.gameId);
		i++;
    });
	c.on('error', function(err) {
			console.log('client disconnected');
		});
	
    c.on('end', function ()
    {
        console.log('nodeServer disconnected');
    });
});
testerIO.listen(6060, function ()
{ //'listening' listener
    console.log('nodeServer listening port:6060');
});

write(joinData);

function write(da){
var client = net.connect({port: 7070},{host: '127.0.0.1'},

	function() { //'connect' listener

			console.log('client connected');
			var data = JSON.stringify(da);
			client.write(data);

		});

		client.on('data', function(data) {
			console.log(data.toString());
			client.end();

		});

		client.on('error', function(err) {
			console.log('client disconnected');
		});
		
		client.on('end', function() {
			console.log('client disconnected');
		});

}