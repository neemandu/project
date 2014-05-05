var agx = require('./agxgame');
//importing loggers
var log = require('./index');
var connectionLogger = log.connectionLogger;
var gameLogger = log.gameLogger;
var winnersLogger = log.winnerLogger;
var offersLogger = log.offersLogger;
var transactionLogger = log.transactionLogger;
var io;
var gameSocket;
var conf;


/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
	console.log('init AH');
	io = sio;
	gameSocket = socket;
	gameSocket.emit('connected', { message: "You are connected!" });
}


exports.doAction = function(sock, data){
	//agx.initGame(io, sock);
	switch (data.Action){
		case "joinGame" :
			return joinGame(data);
			break;
		case "moveUp" :
			console.log('moveUp');
			data.up = true;
			return move(data);
			break;
		case "moveDown" :
			console.log('moveDown');
			data.down = true;
			return move(data);
			break;
		case "moveLeft" :
			console.log('moveLeft');
			data.left = true;
			return move(data);
			break;
		case "moveRight" :
			console.log('moveRight');
			data.right = true;
			return move(data);
			break;
		case "sendOffer" :
			return sendOffer(data);
			break;
		case "rejectOffer" :
			return rejectOffer(data);
			break;
	}
}

function joinGame(data){
	console.log('joinGame');
	data.agent = true;
	return agx.joinGame(data);
}

function move(data){
	data.agent = true;
	return agx.move(data);
}
function sendOffer(data){
	console.log('sendOffer');
	data.agent = true;
	
	return agx.sendOffer(data);
}
function rejectOffer(data){
	console.log('rejectOffer');
	data.agent = true;
	return agx.rejectOffer(data);
}
