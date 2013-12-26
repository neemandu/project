//importing loggers
var log = require('./index');
var connectionLogger = log.connectionLogger;
var gameLogger = log.gameLogger;
var winnersLogger = log.winnerLogger;
var offersLogger = log.offersLogger;
var transactionLogger = log.transactionLogger;


var io;
var gameSocket;
var idRoomPair ={};
var roomSize = 2;
var numOfColors = 6;
var numOfChips = 15;
var colorArray = new Array("purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare","default");

//var currentRoomId = -1;
var newRoomsQueue = require('./Queue');
newRoomsQueue.Queue();
//var playerCounter = 0;


//nimrod -----------------------------------------
var conf;

fs = require('fs');
fs.readFile('\conf.json', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  conf = JSON.parse(data);

});
//nimrod -----------------------------------------

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
	//console.log('init!');
	io = sio;
	gameSocket = socket;
	gameSocket.emit('connected', { message: "You are connected!" });

	// Host Events
	gameSocket.on('hostCreateNewGame', hostCreateNewGame);
	gameSocket.on('hostRoomFull', hostPrepareGame);
	gameSocket.on('hostCountdownFinished', hostStartGame);
	gameSocket.on('hostNextRound', hostNextRound);

	// Player Events
	gameSocket.on('playerJoinGame', playerJoinGame);
	gameSocket.on('playerAnswer', playerAnswer);
	gameSocket.on('playerRestart', playerRestart);
	gameSocket.on('sendMessage', sendMessage);
	gameSocket.on('updateChips', updateChips);
	gameSocket.on('movePlayer', movePlayer);
}

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */
/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
	// Create a unique Socket.IO Room
	var thisGameId = ( Math.random() * 100000 ) | 0;
	// currentRoomId = thisGameId;
	newRoomsQueue.enqueue(thisGameId);
	
	gameLogger.trace('Game #'+thisGameId+' was created by HOST:'+this.id);

	// Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
	this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

	// Join the Room and wait for the players
	this.join(thisGameId.toString());

};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
	var sock = this;
	var data = {
			mySocketId : sock.id,
			gameId : gameId
	};
	//console.log("All Players Present. Preparing game...");
	io.sockets.in(data.gameId).emit('beginNewGame', data);
	newRoomsQueue.dequeue();
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
	console.log('Game Started.');
	var room = gameSocket.manager.rooms["/" + gameId];
	var playerList = {};
	for (var i=0;i<room.length-1;i++)
	{ 
		playerList[i] = i;
		console.log('playerList['+i+']: '+playerList[i]);
	}
	//var params = {height: 8, width: 8, colorsNum: 6};
	var boardHtml = paintBoard(conf);
	
	//  console.log('boardHtml:  '+boardHtml);
	var data ={
			playerList : playerList,
			gameId : gameId,
			board: boardHtml
	};
	io.sockets.in(data.gameId).emit('GameStarted', data);
	/**
	 * create players data:
	 */
	for (var i=0;i<room.length-1;i++)
	{ 
		player = {id:i, chips: createChips(), location: setLocation()};
		io.sockets.in(data.gameId).emit('addPlayer', player);
	}
	/*****************************************/
	
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
	if(data.round < wordPool.length ){
		// Send a new set of words back to the host and players.
		sendWord(data.round, data.gameId);
	} else {
		// If the current round exceeds the number of words, send the 'gameOver' event.
		io.sockets.in(data.gameId).emit('gameOver',data);
	}
}
/* *****************************
 *                           *
 *     PLAYER FUNCTIONS      *
 *                           *
 ***************************** */
/**
 * 
 * @param data msg and other recieverId and gameId.
 */
function sendMessage(data) {
	console.log('sendMessage');
	console.log('game id: '+data.gameId);
	//which room am i
	var room = gameSocket.manager.rooms["/" + data.gameId];	

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

//	io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
	//console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

	// A reference to the player's Socket.IO socket object
	var sock = this;

	// Look up the room ID in the Socket.IO manager object.
	// var room = gameSocket.manager.rooms["/" + data.gameId];
	var currRoom = newRoomsQueue.peek();
	data.gameId = currRoom;
	console.log('currentRoomId: '+currRoom);
	var room = gameSocket.manager.rooms["/" + currRoom];
	console.log('rooom id: '+room);

	// If the room exists...
	if( room != undefined ){

		var playerID = getPlayerId(room,sock);
		console.log('playerID'+ playerID);
		if(playerID < 0){

			// attach the socket id to the data object.
			data.mySocketId = sock.id;

			// Join the room
			//       sock.join(data.gameId);
			//join the current open room.
			sock.join(currRoom);
	
			//data.chips = createChips();
			
			//data.location = setLocation();
			
			data.playerId = room.length - 2;//minus the host. this player is the last in the room.

			console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

			// Emit an event notifying the clients that the player has joined the room.
			//io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
			sock.emit('playerJoinedRoom', data);
			if (room.length === roomSize + 1) {//the room contains all the players and the host - reason for adding 1
				console.log('Room is full. Almost ready!');
				hostPrepareGame(data.gameId);
			}
		}
	} else {
		// Otherwise, send an error message back to the player.
		this.emit('error',{message: "This room does not exist."} );
	}
}
/**
 * this function emits anyone in the room the new player's location.
 * @param data {gameId: int, playerId: int, x: int, y: int}
 */
function movePlayer(data1){	
	var data = {
			playerId: data1.playerId,
			x: data1.x,
			y: data1.y
	}
	io.sockets.in(data.gameId).emit('movePlayer', data);	
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

function setLocation(){
	var location = {
			x : '',
			y : ''
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
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
	// console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

	// The player's answer is attached to the data object.  \
	// Emit an event with the answer so it can be checked by the 'Host'
	io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
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

function getColor(data,i,j){
	var loc = data.Blocks[j];
	//console.dir(loc[1]);
	switch(data.Board.Colors[loc[i]]) 
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

function paintBoard(data){
	var tablesCode = "<table class='trails'>";
	var Color = 0;
	for (var i=0; i<data.Board.Size.Lines; i++)
	{
		tablesCode += "<tr class='trails'>";
		for(var j=0; j< data.Board.Size.Rows; j++)
		{
			tablesCode += "<td class='trails' style=background:" + getColor(data,i,j) +" ;></td>" 
		}
		tablesCode += "</tr>";
	}
	tablesCode += "</table>";
	//var myDiv = document.getElementsByClassName("gameBoard");
	//myDiv.innerHTML = tablesCode;
	return tablesCode;
}


/**
 * this function update the rest of the players with the current transaction
 * @param player1 the first player
 * @param player2 the second player
 */
function updateChips(gameId,player1,player2){
	var data =
	{
			gameId:gameId,
			player1:player1,
			player2:player2
	};
	io.sockets.in(data.gameId).emit('updateChips', data );
}

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier
 */
function sendWord(wordPoolIndex, gameId) {
	var data = getWordData(wordPoolIndex);
	io.sockets.in(data.gameId).emit('newWordData', data);
}

/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
 */
function getWordData(i){
	// Randomize the order of the available words.
	// The first element in the randomized array will be displayed on the host screen.
	// The second element will be hidden in a list of decoys as the correct answer
	var words = shuffle(wordPool[i].words);

	// Randomize the order of the decoy words and choose the first 5
	var decoys = shuffle(wordPool[i].decoys).slice(0,5);

	// Pick a random spot in the decoy list to put the correct answer
	var rnd = Math.floor(Math.random() * 5);
	decoys.splice(rnd, 0, words[1]);

	// Package the words into a single object.
	var wordData = {
			round: i,
			word : words[0],   // Displayed Word
			answer : words[1], // Correct Answer
			list : decoys      // Word list for player (decoys and answer)
	};

	return wordData;
}

/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
	var currentIndex = array.length;
	var temporaryValue;
	var randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}



