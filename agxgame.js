//importing loggers
var log = require('./index');
var connectionLogger = log.connectionLogger;
var gameLogger = log.gameLogger;
var winnersLogger = log.winnerLogger;
var offersLogger = log.offersLogger;
var transactionLogger = log.transactionLogger;

var url = log.url;

var io;
var gameSocket;
var socketIdPair = [];
var idSocketPair = [];
var idRoomPair ={};
var roomSize = 2;
var numOfColors = 6;
var numOfChips = 15;
var colorArray = new Array("purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare","default");
//var currentRoomId = -1;
var newRoomsQueue = require('./Queue');
newRoomsQueue.Queue();
//var playerCounter = 0;
var admin = false;
////nimrod -----------------------------------------
var conf;
//
//fs = require('fs');
//fs.readFile('\conf.json', 'utf8', function (err,data) {
//  if (err) {
//    return console.log(err);
//  }
//  conf = JSON.parse(data);
//
//});
////nimrod -----------------------------------------

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
	io = sio;
	gameSocket = socket;
	gameSocket.emit('connected', { message: "You are connected!" });

	// Host Events
//	gameSocket.on('hostCreateNewGame', hostCreateNewGame);
//	gameSocket.on('hostRoomFull', hostPrepareGame);
//	gameSocket.on('hostCountdownFinished', hostStartGame);

	// Player Events
	gameSocket.on('playerJoinGame', playerJoinGame);
	gameSocket.on('playerRestart', playerRestart);
	gameSocket.on('sendOffer', sendOffer);
	gameSocket.on('updateChips', updateChips);
	gameSocket.on('rejectOffer', rejectOffer);
	gameSocket.on('movePlayer', movePlayer);
}

exports.runConfig = function(configuration){
	conf = configuration;
	var i = 1;
	for(var game in conf.Games){
		console.log("Creating game: " +game);
		createRoom(i, conf.Games[game]);
		i++;
	}
}

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */
function createRoom(gameId, game) {
	console.log('createRoom');
	// Create a unique Socket.IO Room
	console.log('game id: '+gameId);
	
	gameLogger.trace('Game #'+gameId+' was created');

	var shouldStartGame = insertPlayersToRoom(gameId, game);
	
	if(shouldStartGame){
		hostStartGame(gameId, game);
	}
};
//joining the players to the room
function insertPlayersToRoom(thisGameId, game) {
	console.log('Inserting Players Into The Room');
	var sock;
	if(gameSocket != undefined){
		var room = gameSocket.manager.rooms["/" + 0];
		for(var i=0;i<game.playerList.length;i++){
			var socketId = room[game.playerList[i]];
			var socket = io.sockets.sockets[socketId];
			//sock = idSocketPair[conf.players[i]];
			if(socket === undefined){
				console.log('player #'+game.playerList[i]+' does not exist');
				gameLogger.trace('player #'+game.playerList[i]+' does not exist');
			}
			else{
				socket.join(thisGameId.toString()); 
				console.log('player #'+game.playerList[i]+' was added to room #'+thisGameId.toString());
				gameLogger.trace('player #'+game.playerList[i]+' was added to room #'+thisGameId.toString());
			}
		}
		console.log("Finished inserting players to the room");
		return true;
	}
	else{
		console.log('no player have said Hello to the Server yet...');
		return false;
	}
};




/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
//function hostCreateNewGame() {
//	// Create a unique Socket.IO Room
//	var thisGameId = ( Math.random() * 100000 ) | 0;
//	// currentRoomId = thisGameId;
//	newRoomsQueue.enqueue(thisGameId);
//	
//	gameLogger.trace('Game #'+thisGameId+' was created by HOST:'+this.id);
//
//	// Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
//	this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});
//
//	// Join the Room and wait for the players
//	this.join(thisGameId.toString());
//
//};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
//function hostPrepareGame(gameId) {
//	var sock = this;
//	var data = {
//			mySocketId : sock.id,
//			gameId : gameId
//	};
//	//console.log("All Players Present. Preparing game...");
//	io.sockets.in(data.gameId).emit('beginNewGame', data);
//	newRoomsQueue.dequeue();
//}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId, game) {
	console.log('Game #' + gameId +' Started.');
	var room = gameSocket.manager.rooms["/" + gameId];
	room.haveWinner = false;
	room.playerList = new Array();
	room.gameGoal = game.GameConditions.gameGoal;
	room.endConditions = game.GameConditions.endConditions;
	room.board = createServerBoard(game);
	console.log('Server board was created.');
//	
	room.Goals = game.GameConditions.GoalCordinates;

	/**
	 * create players data:
	 */
	for (var i = 0; i < game.players.length; i++)
	{ 
		var player = makePlayerAttributes(i, game, game.players[i]);
		room.board[player.location.x][player.location.y] = 1;
		room.playerList[i] = player;
		room.playerList[i].offer = [];
		console.log(player.name+' id: '+room.playerList[i].id);
		console.log(player.name+' chips: '+room.playerList[i].chips);
		console.log(player.name+' locationX: '+room.playerList[i].location.x+' locationY: '+room.playerList[i].location.y);
		console.log(player.name+' score: '+room.playerList[i].score);
		console.log(player.name+' basic_role: '+room.playerList[i].basic_role);
		console.log('****************************');
	}

	beginRounds(room, game);
	
	/*****************************************/
	
};

function makePlayerAttributes(i, game, player) {
	var p = {};
	p.id = i;
	p.chips = player.chips;
	p.location = setLocation(player);
	p.basic_role =  player.basic_role;
	p.name = player.name;
	p.score = setScore(p.chips, game.GameConditions.score);
	return p;
}
/* *****************************
 *                           *
 *     PLAYER FUNCTIONS      *
 *                           *
 ***************************** */
/**
 * JcolorsToOffer : int,JcolorsToGet : int,msg : string,recieverId : int,sentFrom : int,gameId : int,rowid : int,
 * @param data msg and other recieverId and gameId.
 */
function sendOffer(data) {
	console.log('sendOffer');
	
	console.log('game id: '+data.gameId);
	var tmp =new Array();
	//which room am i
	var room = gameSocket.manager.rooms["/" + data.gameId];
	if(room.playerList[data.recieverId] != undefined){	
		//validating chips
		data.answer = 'yes';
		console.log('sender Id: '+data.sentFrom);
		for(var i=0;i<numOfColors;i++){
			var sum1 = JSON.parse(data.JcolorsToOffer)[i];
			var sum2 = JSON.parse(data.JcolorsToGet)[i];
			console.log('offer: '+sum1+'; Have: '+room.playerList[data.sentFrom].chips[i]+'want: '+sum2+'; Have: '+room.playerList[data.recieverId].chips[i]);
			if((sum1 > room.playerList[data.sentFrom].chips[i]) || (sum2 > room.playerList[data.recieverId].chips[i])){
				data.answer = 'no';
				console.log('NO');
				break;
			}
			tmp[i] = sum1;
		}
		data.answer = isSumOfOffersLegal(data.sentFrom, room,tmp);
		console.log('reciever Id: '+data.recieverId);
	}
	else{
		data.answer = 'no';
	}
	if(data.answer === 'no'){

		this.emit('recieveMessage',data);
	}
	else{
		this.emit('addRowToHistory',data);
		console.log('in the room:'+ room);

		var clientNumber = data.recieverId;
		clientNumber++;
		console.log(clientNumber);
		//what is the receiver socket id
		var socketId = room[''+clientNumber];//the host is the first in the room

		console.log('socket id to send to: '+socketId);
		//get the socket
		var socket = io.sockets.sockets[socketId];

		if(socket == null){
			console.log('trying to send message but the #id: '+data.recieverId+' doesnt exist')
		}
		else{
			console.log('msg: '+data.msg+'to: '+socketId+'from: '+this.id);
			data.playerId = this.id;
			socket.emit('recieveMessage', data)
		}
	}
	

//	io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}


function isSumOfOffersLegal(id,room, tmp){
	for(var i=0;i<numOfColors;i++){
		console.log('tmp['+i+']: '+ tmp[i]);
	}
	for(var i=0;i<numOfColors;i++){
		console.log('offer['+i+']: '+ room.playerList[id].offer[i]);
		if(!(+room.playerList[id].offer[i] + +tmp[i] <= room.playerList[id].chips[i])){
			console.log('Sum Of Offers Is NOT Legal@@@');
			offersLogger.trace('sum of offers is higher than what player #'+id+' has');
			return 'no';
		}
	}
	console.log('isSumOfOffersLegal Legal!!!');
	for(var i=0;i<numOfColors;i++){
		room.playerList[id].offer[i] =+room.playerList[id].offer[i] + +tmp[i]
	}
	
	for(var i=0;i<numOfColors;i++){
		console.log('offer['+i+']: '+ room.playerList[id].offer[i]);
	}
	return 'yes';	
}
function setScore(chips, score){
	var sum = 0;
	for(var i=0;i<chips.length;i++){
	console.log('chips['+i+'] = '+chips[i]);
		sum += chips[i];
	}
	sum *= score.pointsPerChips;
	return sum
}
function ChipScore(chips){
	var sum = 0;
	for(var i=0;i<chips.length;i++){
		console.log('conf.scoreMethod['+i+']: '+conf.scoreMethod[i]);
		console.log('chips['+i+']: '+chips[i]);
		sum =+sum + (+chips[i] * +conf.scoreMethod[i]);
		console.log('sum: '+sum);
	}
	return sum;
}

function playerJoinGame(data) {
	console.log('Player attempting to join game ');

	// A reference to the player's Socket.IO socket object
	var sock = this;

	var currRoom = 0;
//	data.gameId = currRoom;
	var room = gameSocket.manager.rooms["/" + currRoom];
	console.log('room id: '+currRoom);

	// If the room exists...
	if( room != undefined ){

		var playerID = getPlayerId(room,sock);
		console.log('playerID'+ playerID);
		if(playerID < 0){

			// attach the socket id to the data object.
			data.mySocketId = sock.id;

			//join the current open room.
			sock.join(currRoom.toString());
			
			data.playerId = room.length - 1;//minus the host. this player is the last in the room.

			console.log('Player ' + data.playerId + ' joined the game');

			// Emit an event notifying the clients that the player has joined the room.
			sock.emit('playerJoinedRoom', data);
//			if (room.length === roomSize + 1) {//the room contains all the players and the host - reason for adding 1
//				console.log('Room is full. Almost ready!');
//				hostPrepareGame(data.gameId);
//			}
		}
	} else {
		data.mySocketId = sock.id;

		//join the current open room.
		sock.join(currRoom.toString());
		
		data.playerId = 0;//minus the host. this player is the last in the room.

		console.log('Player ' + data.playerId + ' joined the game');

		// Emit an event notifying the clients that the player has joined the room.
		sock.emit('playerJoinedRoom', data);
	}
}
/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
//function playerJoinGame(data) {
//	//console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );
//	
//	// A reference to the player's Socket.IO socket object
//	var sock = this;
//	console.log(sock.id + ' is connecting');
//	console.log(idSocketPair[idSocketPair.length] );
//	console.log(socketIdPair[sock]);
//	if(socketIdPair[sock] === undefined){
//		socketIdPair[sock] = idSocketPair.length;
//	
//		idSocketPair[idSocketPair.length] = sock;
//		
//		console.log(idSocketPair);
//		
//		// Look up the room ID in the Socket.IO manager object.
//		// var room = gameSocket.manager.rooms["/" + data.gameId];
//	//	var currRoom = newRoomsQueue.peek();
//	//	data.gameId = currRoom;
//	//	console.log('currentRoomId: '+currRoom);
//		var room = gameSocket.manager.rooms["/" + 0];
//	//	console.log('rooom id: '+room);
//	
//		// If the room exists...
//	//	if( room != undefined ){
//	
//	//		var playerID = getPlayerId(room,sock);
//		//	console.log('playerID'+ playerID);
//		//	if(playerID < 0){
//	
//				// attach the socket id to the data object.
//				data.mySocketId = sock.id;
//	
//				//join the current open room.
//	//			sock.join(currRoom);
//				
//		//		data.playerId = room.length - 2;//minus the host. this player is the last in the room.
//	
//				data.playerId = idSocketPair.length - 1;
//					
//				console.log('Player ' + data.playerId + ' said hello to the server!');
//	
//				// Emit an event notifying the clients that the player has joined the room.
//				sock.emit('playerJoinedRoom', data);
//	//			if (room.length === roomSize + 1) {//the room contains all the players and the host - reason for adding 1
//	//				console.log('Room is full. Almost ready!');
//	//				hostPrepareGame(data.gameId);
//	//			}
//	//		}
//	} 
////		// Otherwise, send an error message back to the player.
////		this.emit('error',{message: "This room does not exist."} );
////	}
//}
/**
 * 
 * this function emits anyone in the room the new player's location.
 * @param data {gameId:int ,playerId : int, x: int , y : int , currX: int , currY: int , chip : int}
 */
function movePlayer(data1){
	console.log('x: '+data1.x);
	console.log('currX: '+data1.currX);
	console.log('y: '+data1.y);
	console.log('currY: '+data1.currY);
	var room = gameSocket.manager.rooms["/" + data1.gameId];
	if(room.board[data1.x][data1.y] === 0){
		var data = {
				playerId: data1.playerId,
				x: data1.x,
				y: data1.y,
				chip: data1.chip
		}
		room.board[data1.x][data1.y] = 1;
		room.board[data1.currX][data1.currY] = 0;
		updateLocation(room, data1.playerId, data1.x, data1.y);
		io.sockets.in(data.gameId).emit('movePlayer', data);
		if((data1.x === room.Goal.x) && (data1.y === room.Goal.y)){
			room.gameOver = true;
			io.sockets.in(room.gameId).emit('Winner', data);
			console.log('we have a winner!, player #'+data1.playerId)
		}
	}
}

function updateLocation(room, playerId, x, y){
	console.log('player id: '+playerId);
	room.playerList[playerId].location.x = x;
	room.playerList[playerId].location.y = y;
	console.log('new x: '+ room.playerList[playerId].location.x + '       new y: '+ room.playerList[playerId].location.y);
	console.log('player id: '+room.playerList[playerId].id);
}

function createChips(){
	var chips = new Array();	
	for(var i=0; i<numOfColors;i++){	 
		var numchips = Math.floor(Math.random()*numOfChips);
		console.log('chips color: '+colorArray[i]+' amount: '+numchips);
		chips[i] = numchips;
	}
	return chips;
}

function setLocation(p){
	var location = {
			x : p.locationX,
			y : p.locationY
	}
	
	return location;

}



function getPlayerId(room,socket){
	var i=0;
	console.log('socket to  look for: '+socket.id);
	//	console.log('room #  :'+roomID+' size: '+idRoomPair[roomID].length);
	for(var key in room){	
		//console.log('idSocketPair[key]: '+ idRoomPair[roomID][key].id);
		if(room[key] === socket.id){
			console.log('founded it!!!!, key = '+key);
			console.log('####getPlayerId');
			return i;
		}
		i++;
	}
	console.log('####getPlayerId');
	return -1;
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
	// console.log('Player: ' + data.playerName + ' ready for new game.');

	// Emit the player's data back to the clients in the game room.
	data.playerId = this.id;
	io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
 *                       *
 *      GAME LOGIC       *
 *                       *
 ************************* */
 function beginRounds(room, game){
	var from = game.rounds.rounds_defenitions.length;
	var to = 0;
	var numberOfTimesToRepeatRounds = 1;
	//check if there should be a repetition on rounds.
	if(game.rounds.General != undefined){
		if(game.rounds.General.roundsToRepeat != undefined){
			from = game.rounds.General.roundsToRepeat.from;
			to = game.rounds.General.roundsToRepeat.to;
			numberOfTimesToRepeatRounds = game.rounds.General.numberOfTimesToRepeatRounds;
			console.log('from: '+from);
			console.log('to: '+to);
			gameLogger.trace('from: '+from);
			gameLogger.trace('to: '+to);
		}
	}
	//doing rounds 0-from
	console.log('doing rounds 0-from');
	for(var i=0;i<game.rounds.rounds_defenitions.length && i<from;i++){
		for(var k=0;k<game.rounds.rounds_defenitions[i].phases_in_round.length && (room.haveWinner === false ); k++){
			console.log('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
			console.log('round: '+game.rounds.rounds_defenitions[i].name);
			gameLogger.trace('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
			gameLogger.trace('round: '+game.rounds.rounds_defenitions[i].name);
			beginphase(game.rounds.rounds_defenitions[i].phases_in_round[k], game.rounds.rounds_defenitions[i], room, game.roles, game.phases);
		}
	}
	if(from < game.rounds.rounds_defenitions.length){
		if(numberOfTimesToRepeatRounds === -1){
			console.log('doing rounds from-to for unlimited repetitions');
			//doing rounds from-to for unlimited repetitions
			while(room.haveWinner === false ){
				for(var i=from ;i<=to && i<game.rounds.rounds_defenitions.length && (room.haveWinner === false ); i++){
					for(var k=0;k<game.rounds.rounds_defenitions[i].phases_in_round.length && (room.haveWinner === false ); k++){
						console.log('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						console.log('round: '+game.rounds.rounds_defenitions[i]);
						gameLogger.trace('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						gameLogger.trace('round: '+game.rounds.rounds_defenitions[i].name);
						beginphase(game.rounds.rounds_defenitions[i].phases_in_round[k], game.rounds.rounds_defenitions[i], room, game.roles, game.phases);
					}
				}
			}
		}
		else{
			//doing rounds from-to for limited repetitions
			console.log('doing rounds from-to for limited repetitions');
			for(var f = 0 ; f < numberOfTimesToRepeatRounds && (room.haveWinner === false ); f++){
				for(var i=from ;i<=to && i<game.rounds.rounds_defenitions.length && (room.haveWinner === false ); i++){
					for(var k=0;k<game.rounds.rounds_defenitions[i].phases_in_round.length && (room.haveWinner === false ); k++){
						console.log('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						console.log('round: '+game.rounds.rounds_defenitions[i].name);
						gameLogger.trace('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						gameLogger.trace('round: '+game.rounds.rounds_defenitions[i].name);
						beginphase(game.rounds.rounds_defenitions[i].phases_in_round[k], game.rounds.rounds_defenitions[i], room, game.roles, game.phases);
					}
				}
			}
		//doing rounds to-end of the rounds		
			console.log('doing rounds to-end of the rounds	');		
			for(var i=to;i<game.rounds.rounds_defenitions.length && (room.haveWinner === false );i++){
				for(var k=0;k<game.rounds.rounds_defenitions[i].phases_in_round.length && (room.haveWinner === false ); k++){
						console.log('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						console.log('round: '+game.rounds.rounds_defenitions[i].name);
						gameLogger.trace('phase: '+game.rounds.rounds_defenitions[i].phases_in_round[k]);
						gameLogger.trace('round: '+game.rounds.rounds_defenitions[i].name);
					beginphase(game.rounds.rounds_defenitions[i].phases_in_round[k], game.rounds.rounds_defenitions[i], room, game.roles, game.phases);
				}
			}
		}
	}
	
}


function beginphase(phaseName, round, room, roles, phases){
	console.log('beginphase');
	gameLogger.trace('beginphasev');
	clearPlayersAttributes(room);
	buildPlayersAttributs(phaseName, round, room, roles, phases);
	console.log('finish building attributes');
	console.log('room.playerList.length: '+room.playerList.length);
	gameLogger.trace('finish building attributes');
	gameLogger.trace('room.playerList.length: '+room.playerList.length);
	for(var i=0;i<room.playerList.length;i++){
	console.log('***********************');
		gameLogger.trace(room.playerList[i].name+' attributes:');
		gameLogger.trace('   canMove '+room.playerList[i].canMove);
		gameLogger.trace('   canOffer '+room.playerList[i].canOffer);
		gameLogger.trace('   canTransfer '+room.playerList[i].canTransfer);
		gameLogger.trace('   canSeeChips '+room.playerList[i].canSeeChips);
		gameLogger.trace('   canSeeLocations '+room.playerList[i].canSeeLocations);
		gameLogger.trace('   num_of_offers_per_player '+room.playerList[i].num_of_offers_per_player);
		gameLogger.trace('   total_num_of_offers '+room.playerList[i].total_num_of_offers);
		gameLogger.trace('   can_offer_to '+room.playerList[i].can_offer_to);
		gameLogger.trace('***********************');

		console.log('***********************');
		console.log(room.playerList[i].name+' attributes:');
		console.log('   canMove '+room.playerList[i].canMove);
		console.log('   canOffer '+room.playerList[i].canOffer);
		console.log('   canTransfer '+room.playerList[i].canTransfer);
		console.log('   canSeeChips '+room.playerList[i].canSeeChips);
		console.log('   canSeeLocations '+room.playerList[i].canSeeLocations);
		console.log('   num_of_offers_per_player '+room.playerList[i].num_of_offers_per_player);
		console.log('   total_num_of_offers '+room.playerList[i].total_num_of_offers);
		console.log('   can_offer_to '+room.playerList[i].can_offer_to);
		console.log('***********************');
	}
	//phasesHalper(room,keys,i);
}

function clearPlayersAttributes(room){
	console.log('clearPlayersAttributes');
	console.log('room.playerList.length: '+room.playerList.length);
	
	gameLogger.trace('clearPlayersAttributes');
	gameLogger.trace('room.playerList.length: '+room.playerList.length);
	for(var i=0;i<room.playerList.length;i++){
		room.playerList[i].canMove = 0;
		room.playerList[i].canOffer = 0;
		room.playerList[i].canTransfer = 0;
		room.playerList[i].canSeeChips = 0;
		room.playerList[i].canSeeLocations = 0;
		room.playerList[i].num_of_offers_per_player = -1;
		room.playerList[i].total_num_of_offers = -1;
		room.playerList[i].can_offer_to = [];
	}
}

function buildPlayersAttributs(phaseName, round, room, gameRoles, phases){
	console.log('buildPlayersAttributs');
	console.log('room.playerList.length: '+room.playerList.length);
	
	
	gameLogger.trace('buildPlayersAttributs');
	gameLogger.trace('room.playerList.length: '+room.playerList.length);
	for(var i=0;i<room.playerList.length;i++){
		//going through all basic roles
		gameLogger.trace('for 1');
		for(var j=0;j<room.playerList[i].basic_role.length;j++){
			checkActions(room.playerList[i], gameRoles[room.playerList[i].basic_role[j]]);	
		}
		gameLogger.trace('for 2');
		//going through all round's roles
		for(var j=0;j<round.players_roles[room.playerList[i].name].role.length;j++){
			checkActions(room.playerList[i], gameRoles[round.players_roles[room.playerList[i].name].role[j]]);	
		}
		gameLogger.trace('rounds add');
		//add additional actions from round
		checkActions(room.playerList[i], round.players_roles[room.playerList[i].name].additional_actions);
		gameLogger.trace('phases add');
		//going through all phase's roles
		checkActions(room.playerList[i], phases[phaseName].actions);
	}
}
function checkActions(player, searchPlace){
console.log(' ');
	console.log('***************************** ');
	console.log('checkActions ');
	
	gameLogger.trace(' ');
	gameLogger.trace('***************************** ');
	gameLogger.trace('checkActions ');
	for(var h in searchPlace){
		console.log('att: '+h);	
		gameLogger.trace('att: '+h);		
		gameLogger.trace('val: '+searchPlace[h]);					
		switch(h){
			case 'canMove':
				player.canMove = searchPlace[h];
				break;
			case 'canOffer':
				player.canOffer = searchPlace[h];
				break;
			case 'canTransfer':
				player.canTransfer = searchPlace[h];
				break;
			case 'canSeeChips':
				player.canSeeChips = searchPlace[h];
				break;
			case 'canSeeLocations':
				player.canSeeLocations = searchPlace[h];
				break;
			case 'num_of_offers_per_player':
				player.num_of_offers_per_player = searchPlace[h];
				break;
			case 'total_num_of_offers':
				player.total_num_of_offers = searchPlace[h];
				break;
			case 'can_offer_to':
				player.can_offer_to = searchPlace[h];
				break;
		}
	}
}

function phasesHalper(room,keys, i){
	var data = {
			
			name : conf.phases[keys[i]].name,
			canMove : conf.phases[keys[i]].canMove,
			canOffer : conf.phases[keys[i]].canOffer,
			canTransfer : conf.phases[keys[i]].canTransfer,
			time : conf.phases[keys[i]].time,
		}
	console.log('key: '+ conf.phases[keys[i]].name);
	console.log('time: '+ conf.phases[keys[i]].time);
	deleteFormerOffers(room);
	io.sockets.in(room.gameId).emit('beginFaze', data);
	var f = i;
	f++;
	f %= keys.length;
	console.log('room.gameOver: '+ room.gameOver);
	if(!room.gameOver){
		setTimeout(function(){ return phasesHalper(room,keys, f);}, conf.phases[keys[i]].time);
	}
}

function deleteFormerOffers(room){
	for(var i=0;i<room.length;i++){
		for(var j=0;j<numOfColors;j++){
			room.playerList[i].offer[j] = 0;
		}
		
	}
}
function manhattanDistance(room, x, y){
	return ((Math.abs(+room.Goal.x - +x))+(Math.abs(+room.Goal.y - +y)));
}



function getColor(i,j){
	var loc = conf.Blocks[j];
	//console.dir(loc[1]);
	switch(conf.Board.Colors[loc[i]]) 
	{
	case "purple":
		return "#aa88FF"; // purple
		break;
	case "green":
		return "#9dffb4"; // light green
		break;
	case "yellow":
		return "#f8ff9d"; // light yellow
		break;
	case "pink":
		return "#ff9f9d"; // pink
		break;
	case "blue":
		return "#99ccf5"; //light blue
		break;
	case "darkblue":
		return "#5588b1";
		break
	case "black":
		return "#2f2e19"; //
	case "white":
		return "#fcf7f7"; //
	case "red":
		return "#d90f0f"; //		
	default:
		return "#AAAAAA";
	}
}

function paintBoard(){
	var tablesCode = "<table class='trails'>";
	var Color = 0;
	for (var i=0; i<conf.Board.Size.Lines; i++)
	{
		tablesCode += "<tr class='trails'>";
		for(var j=0; j< conf.Board.Size.Rows; j++)
		{
			tablesCode += "<td class='trails' style=background:" + getColor(i,j) +" ;></td>" 
		}
		tablesCode += "</tr>";
	}
	tablesCode += "</table>";
	//var myDiv = document.getElementsByClassName("gameBoard");
	//myDiv.innerHTML = tablesCode;
	return tablesCode;
}

function createServerBoard(game){
	var board = conf.Global.boards[game.Board];
	/*
	for (var i=0;i<conf.Board.Size.Lines;i++) {
		board[i] = [];
	}

	var Color = 0;
	*/	
	for (var i=0; i<board.length; i++){
		for(var j=0; j< board[i].length; j++){
			board[i][j] = 0;
		}
	}
	return board;
}


/**
 * this function update the rest of the players with the current transaction
 * @param player1 the reciever player
 * @param player2 the sender player
 */
function updateChips(data){
	var room = gameSocket.manager.rooms["/" + data.gameId];	 
	console.log('');
	for(var i=0;i<numOfColors;i++){
		console.log('#'+data.player1.id+' has: '+room.playerList[data.player1.id].chips[i]+' of color: '+i);
		console.log('#'+data.player2.id+' has: '+room.playerList[data.player2.id].chips[i]+' of color: '+i);
	}
	for(var i=0;i<numOfColors;i++){
		var sum1 = data.player1.colorsToAdd[i];
		var sum2 = data.player2.colorsToAdd[i];
		console.log('sum1: '+sum1);
		console.log('sum2: '+sum2);
		room.playerList[data.player1.id].chips[i] =+room.playerList[data.player1.id].chips[i] + +sum1;
		room.playerList[data.player2.id].chips[i] =+room.playerList[data.player2.id].chips[i] - +sum1;
		room.playerList[data.player1.id].chips[i] =+room.playerList[data.player1.id].chips[i] - +sum2;
		room.playerList[data.player2.id].chips[i] =+room.playerList[data.player2.id].chips[i] + +sum2;
	}
	for(var i=0;i<numOfColors;i++){
		console.log('#'+data.player1.id+' has: '+room.playerList[data.player1.id].chips[i]+' of color: '+i);
		console.log('#'+data.player2.id+' has: '+room.playerList[data.player2.id].chips[i]+' of color: '+i);
	}
	var data =
	{
			gameId:data.gameId,
			player1:data.player1,
			player2:data.player2
	};
	io.sockets.in(data.gameId).emit('updateChips', data );
}

function rejectOffer(data){
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	var socketId = room[''+data.id];
	var socket = io.sockets.sockets[socketId];
	var send ={
			rowid : data.rowid
	}
	socket.emit('rejectOffer',send);
}

