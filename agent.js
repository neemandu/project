var net = require('net');

var gameId;

var joinData = {
	"Type" : "Agent",
	
 	"Action" : "joinGame",
	
	"ID" : 7,
	
	"listening_port" : 6060,
	
	"IP" : '127.0.0.1'
	};


var moveUpData = {
	"Type" : "Agent",
	
 	"Action" : "moveUp",
	
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
				BeginPhase(conf);
				break;
			case 'Move':
				Move(conf);
				break;
			case 'Offer':
				Offer(conf);
				break;
			case 'IllegalOffer':
				IllegalOffer(conf);
				break;
			case 'RejectOffer':
				RejectOffer(conf);
				break;
			case 'AcceptOffer':
				AcceptOffer(conf);
				break;
			case 'gameOver':
				gameOver(conf);
				break;
			default :
				error(conf);
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
//unexpected data from server
function error(da){
	console.log('error');
}
//gameOver
function gameOver(da){
	console.log('gameOver');
}
//a new phase has begun
function BeginPhase(da){
	console.log('BeginPhase');
	gameId = da.gameId;
	console.log('gameId: ' +gameId);
	var moveDownData = {
	"Type" : "Agent",
	
 	"Action" : "moveUp",
	
	"ID" : 7,
	
	"gameId" : gameId
	
	
	};
	write(moveDownData);
}
//someone has moved
function Move(da){
	console.log('Move');
}
//someone made me an offer
function Offer(da){
	console.log('Offer');
	var rejectData = {
	"Type" : "Agent",
	
 	"Action" : "rejectOffer",
	
	"ID" : 7,
	
	"sentFrom" : da.sentFrom,
	
	"offerId" : da.offerId,
	
	"gameId" : gameId
	
	};
	var JcolorsToGet = JSON.parse(da.JcolorsToGet);
	var JcolorsToOffer = JSON.parse(da.JcolorsToOffer);
	var player1 = {id: da.sentFrom, colorsToAdd: JcolorsToGet,offerId: da.offerId};
	var player2 = {id: da.recieverId, colorsToAdd: JcolorsToOffer};
	
	var acceptData = {
	"Type" : "Agent",
	
 	"Action" : "acceptOffer",
	
	"ID" : 7,
	
	"player1" : player1,
	
	"player2" : player2,

			
	"gameId" : gameId
	
	};
	
	write(acceptData);
}
//someone has rejected my offer
function RejectOffer(da){
	console.log('RejectOffer');
}
//someone has accepted my offer
function AcceptOffer(da){
	console.log('AcceptOffer');
}
//I made an illegal offer
function IllegalOffer(da){
	console.log('IllegalOffer');
}
//write to server
function write(da){
	var client = net.connect({port: 7070},{host: '127.0.0.1'},
	function() { //'connect' listener

			console.log('client connected');
			var data = JSON.stringify(da);
			data.gameId = gameId;
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