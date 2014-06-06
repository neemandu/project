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
	
write(joinData);
	
var testerIO = net.createServer(function (c)
{ //'connection' listener
	console.log('Java client connected to this nodeServer');
    c.on('data', function (data)
    {
		var conf = JSON.parse(data);
    	console.log(conf);
		
    	//c.write(res);
    	//c.pipe(c);
		switch (conf.action) {
			case 'BeginPhase':
				BeginPhase(data);
				break;
			case 'Move':
				Move(data);
				break;
			case 'Offer':
				Offer(data);
				break;
			case 'IllegalOffer':
				IllegalOffer(data);
				break;
			case 'RejectOffer':
				RejectOffer(data);
				break;
			case 'AcceptOffer':
				AcceptOffer(data);
				break;
			default :
				error(data);
		}
		
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
function error(da){
	console.log('error');
}
function BeginPhase(da){
	console.log('BeginPhase');
}
function Move(da){
	console.log('Move');
}
function Offer(da){
	console.log('Offer');
}
function RejectOffer(da){
	console.log('RejectOffer');
}
function AcceptOffer(da){
	console.log('AcceptOffer');
}
function IllegalOffer(da){
	console.log('IllegalOffer');
}
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