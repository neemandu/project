//importing loggers
var log = require('./index');
var net = require('net');
var connectionLogger = log.connectionLogger;
var gameLogger = log.gameLogger;
var winnersLogger = log.winnerLogger;
var offersLogger = log.offersLogger;
var transactionLogger = log.transactionLogger;

var url = log.url;
var gameIDs = new Array();
//initializing gameIDs array.
for(var i=1;i<=1000;i++){
	gameIDs[i] = 0;
}
var io;
var gameSocket;
var agents = [];
var idSocketPair = [];
var idRoomPair ={};
var numOfColors = 6;
var numOfChips = 15;
var colorArray = new Array("purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare","default");
var newRoomsQueue = require('./Queue');
newRoomsQueue.Queue();
var admin = false;
var conf;

var OK = 200;

var DATABASE = true;

async = require("async");


if (DATABASE){
var presistance  = require('./Presistence');
async.series([
              
              function(callback){
            	  //presistance.syncDatabase();
            	  callback();
              },
              function(callback){
            	  presistance.addUser(1);
              callback();
              }
          ]);
};


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
	numOfColors = conf.Global.Colors.length;
	//creating gameID
	var game_id=Math.floor((Math.random()*1000)+1);
	while(gameIDs[game_id] != 0){
		game_id=Math.floor((Math.random()*1000)+1);
	}
	gameIDs[game_id] = 1;//this game id is available.
			
	gameLogger.debug('Game #'+game_id+' was created');
	if(gameSocket != undefined){
	
		var shouldStartGame = insertPlayersToRoom(game_id);
		
		if(shouldStartGame){
			var room = gameSocket.manager.rooms["/" + game_id];
			room.gameId = game_id;
			room.conf = conf;		
			room.currentGame = 0; //the current index of the game of the conf.Games array.
			hostStartGame(room);
		}
	}
	else{
		console.log('no player have said Hello to the Server yet...');
		return false;
	}
	
	
}

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */

 
 
 
//joining the players to the room
function insertPlayersToRoom(thisGameId) {
	var playerList = conf.Global.playerList;
	var agentList = conf.Global.agentList;
	console.log('Inserting Players Into The Room');
	if(gameSocket != undefined){
		var room = gameSocket.manager.rooms["/" + 0];
		for(var i=0;i<playerList.length;i++){
			var socketId = room[playerList[i]];
			var socket = io.sockets.sockets[socketId];
			if(socket === undefined){
				console.log('player #'+playerList[i]+' does not exist');
				gameLogger.debug('player #'+playerList[i]+' does not exist');
				return false;
			}
			else{
				socket.join(thisGameId.toString()); 
				console.log('player #'+playerList[i]+' was added to room #'+thisGameId.toString());
				gameLogger.debug('player #'+playerList[i]+' was added to room #'+thisGameId.toString());
			}
		}
		for(var i=0;i<agentList.length;i++){
			if(agents[agentList[i]] === undefined){
				console.log('agent #'+agentList[i]+' does not exist');
				gameLogger.debug('agent #'+agentList[i]+' does not exist');
				return false;
			}
		}
		console.log("Finished entering players to the room");
		return true;
	}
	else{
		console.log('no player have said Hello to the Server yet...');
		return false;
	}
};
function hostStartGame(room) {
	
	var game = room.conf.Games[room.currentGame];
	gameLogger.debug("Starting game: " +room.conf.Games[room.currentGame].GAME_NAME);
	room.gameOver = false;
	room.haveWinner = false;
	room.playerList = new Array();
	room.gameGoal = game.GameConditions.gameGoal;
	room.endConditions = game.GameConditions.endConditions;
	room.guiboard =room.conf.Global.boards[game.Board];
	gameLogger.debug("board: "+room.guiboard);
	room.board = createServerBoard(game);
	room.agentsIDs = room.conf.Global.agentList;
	gameLogger.debug("board: "+room.guiboard);
	gameLogger.debug('Server board was created.');
//	
	room.Goals = game.GameConditions.GoalCordinates;

	/**
	 * create players data:
	 */
	for (var i = 0; i < room.conf.Global.playerList.length; i++)
	{ 
		var p = findPlayer(game.players, room.conf.Global.playerList[i]);
		var player = makePlayerAttributes(game, p);
		player.agent = false;
		/*
		var socketId = room[i];
		var socket = io.sockets.sockets[socketId];
		player.socket = socket;
		*/
		room.board[player.location.x][player.location.y] = 1;
		room.playerList[i] = player;
		room.playerList[i].offer = [];
		gameLogger.debug(player.name+' id: '+room.playerList[i].id);
		gameLogger.debug(player.name+' chips: '+room.playerList[i].chips);
		gameLogger.debug(player.name+' locationX: '+room.playerList[i].location.x+' locationY: '+room.playerList[i].location.y);
		gameLogger.debug(player.name+' score: '+room.playerList[i].score);
		gameLogger.debug(player.name+' basic_role: '+room.playerList[i].basic_role);
		gameLogger.debug('****************************');
	}
	var l = room.conf.Global.playerList.length;
	//joining all agents.
	for (var i = l; i < l + room.conf.Global.agentList.length; i++)
	{ 
		var p = findPlayer(game.agents, room.conf.Global.agentList[i-l]);
		var player = makeAgentAttributes(game, p);
		room.board[player.location.x][player.location.y] = 1;
		room.playerList[i] = player;
		room.playerList[i].offer = [];
		gameLogger.debug(player.name+' id: '+room.playerList[i].id);
		gameLogger.debug(player.name+' chips: '+room.playerList[i].chips);
		gameLogger.debug(player.name+' locationX: '+room.playerList[i].location.x+' locationY: '+room.playerList[i].location.y);
		gameLogger.debug(player.name+' score: '+room.playerList[i].score);
		gameLogger.debug(player.name+' basic_role: '+room.playerList[i].basic_role);
		gameLogger.debug('is agent: '+room.playerList[i].agent);
		gameLogger.debug('****************************');
	}
	gameLogger.debug('###########################');
	beginRounds(room, game);
	
	/*****************************************/
	
};

function findPlayer(pl, id) {
	for(var i=0;i<pl.length; i++){
		if(pl[i].id === id){
			return pl[i];
		}
	}
}
function findPlayerInd(pl, id) {
	console.log('findPlayerInd');
	for(var i=0;i<pl.length; i++){
		if(pl[i].id === id){
			console.log('findPlayerInd FOUND!');
			console.log('index: '+i);
			return i;
		}
	}
}
function makePlayerAttributes(game, player) {
	var p = {};
	p.id = player.id;
	p.chips = player.chips;
	p.location = setLocation(player);
	p.basic_role =  player.basic_role;
	p.name = player.name;
	p.score = setScore(p.chips, game.GameConditions.score);
	p.agent = false;
	return p;
}
function makeAgentAttributes(game, player) {
	var p = makePlayerAttributes(game, player);
	p.agent = true;
	p.listening_port = player.listening_port;
	p.IP = player.IP;
	p.specialID = player.specialID;
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
	gameLogger.trace('sendOffer');
	
	console.log('game id: '+data.gameId);
	var tmp =new Array();
	//which room am i
	var room = gameSocket.manager.rooms["/" + data.gameId];
	if(room.playerList[data.recieverId] != undefined){	
		//validating chips
		data.answer = 'yes';
		gameLogger.trace('sender Id: '+data.sentFrom);
		for(var i=0;i<numOfColors;i++){
			var sum1 = JSON.parse(data.JcolorsToOffer)[i];
			if(sum1 === undefined){
				sum1 = 0;
			}
			var sum2 = JSON.parse(data.JcolorsToGet)[i];
			if(sum2 === undefined){
				sum2 = 0;
			}
			gameLogger.trace('offer: '+sum1+'; Have: '+room.playerList[data.sentFrom].chips[i]+'want: '+sum2+'; Have: '+room.playerList[data.recieverId].chips[i]);
			if(sum1 > room.playerList[data.sentFrom].chips[i]){
				if(room.playerList[data.sentFrom].canSeeChips === 1){
					if(sum2 > room.playerList[data.recieverId].chips[i]){
						data.answer = 'no';
						gameLogger.trace('Illegal offer - you do not have enough chips to make this offer');
						break;
					}
				}
			}
			tmp[i] = sum1;
		}
		//data.answer = isSumOfOffersLegal(data.sentFrom, room,tmp);
		gameLogger.trace('reciever Id: '+data.recieverId);
	}
	else{
		data.answer = 'no';
	}
	if(data.answer === 'no'){
		sendMsg(room, data.sentFrom, 'recieveMessage', data);
	//	this.emit('recieveMessage',data);
	}
	else{
		sendMsg(room, data.sentFrom, 'addRowToHistory', data);
		//this.emit('addRowToHistory',data);
		data.playerId = this.id;
		sendMsg(room, data.recieverId, 'recieveMessage', data);
/*	
	var socketId = room[''+data.recieverId];
		var socket = io.sockets.sockets[socketId];
		if(socket == null){
			gameLogger.trace('trying to send offer but the #id: '+data.recieverId+' doesnt exist')
		}
		else{
			data.playerId = this.id;
			
			socket.emit('recieveMessage', data)
		}
		*/
	}
}


function isSumOfOffersLegal(id,room, tmp){
	for(var i=0;i<numOfColors;i++){
		console.log('tmp['+i+']: '+ tmp[i]);
	}
	for(var i=0;i<numOfColors;i++){
		console.log('offer['+i+']: '+ room.playerList[id].offer[i]);
		if(!(+room.playerList[id].offer[i] + +tmp[i] <= room.playerList[id].chips[i])){
			console.log('Sum Of Offers Is NOT Legal@@@');
			offersLogger.debug('sum of offers is higher than what player #'+id+' has');
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
		sum += chips[i];
	}
	sum *= score.pointsPerChips;
	return sum
}
function ChipScore(chips){
	var sum = 0;
	for(var i=0;i<chips.length;i++){
		gameLogger.trace('conf.scoreMethod['+i+']: '+conf.scoreMethod[i]);
		gameLogger.trace('chips['+i+']: '+chips[i]);
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
			
			data.playerId = room.length - 1;//this player is the last in the room.

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
	//check if player reached one of the goals
	if(room != undefined){
		for(var i=0;i<room.Goals.length;i++){
			if((data1.x === room.Goals[i][0]) && (data1.y === room.Goals[i][1])){
				room.gameOver = true;
				updateWinnerChips(room, data1.x, data1.y, room.playerList[data1.playerId],conf.Games[room.currentGame].GameConditions);
			}
		}
		
		if((room.board[data1.x][data1.y] === 0) ||(room.gameOver)){
			room.playerList[data1.playerId].chips[data1.chip]--;
			room.playerList[data1.playerId].score = setScore(room.playerList[data1.playerId].chips, room.conf.Games[room.currentGame].GameConditions.score);
			var data = {
					playerId: data1.playerId,
					x: data1.x,
					y: data1.y,
					chip: data1.chip,
					score : room.playerList[data1.playerId].score
			}
			room.playerList[data1.playerId].moved = true;
			room.playerList[data1.playerId].roundsNotMoving = 0;
			room.board[data1.x][data1.y] = 1;
			room.board[data1.currX][data1.currY] = 0;
			updateLocation(room, data1.playerId, data1.x, data1.y);
			for(var i=0;i<room.playerList.length;i++){
				sendMsg(room, i, 'movePlayer', data);
			}
		//	io.sockets.in(data.gameId).emit('movePlayer', data);
		}
		if(room.gameOver){
			gameLogger.debug('line 369' );
			gameOver(room, room.conf.Games[room.currentGame]);
		}
	}
}


function updateWinnerChips(room, x, y, player, gameConditions){
	if(gameConditions.score != undefined){
		if(gameConditions.score.onReachGoalPlayerView != undefined){
			player.score += gameConditions.score.onReachGoalPlayerView;
		}
		if(gameConditions.score.onReachGoalGoalView != undefined){
		var stop = false;
			for(var i=0;i<room.playerList.length && !stop;i++){
				if((room.playerList[i].location.x === x) && (room.playerList[i].location.y === y)){
					room.playerList[i].score += gameConditions.score.onReachGoalGoalView;
					stop = true;
				}
			}
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
/*
function createChips(){
	var chips = new Array();	
	for(var i=0; i<numOfColors;i++){	 
		var numchips = Math.floor(Math.random()*numOfChips);
		console.log('chips color: '+colorArray[i]+' amount: '+numchips);
		chips[i] = numchips;
	}
	return chips;
}
*/
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
			return i;
		}
		i++;
	}
	return -1;
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
	// console.log('Player: ' + data.playerName + ' ready for new game.');
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	// Emit the player's data back to the clients in the game room.
	data.playerId = this.id;
	for(var i=0;i<room.playerList.length;i++){
		sendMsg(room, i, 'playerJoinedRoom', data);
	}
	//io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
 *                       *
 *      GAME LOGIC       *
 *                       *
 ************************* */
 function beginRounds(room, game){
	room.roundNumber = 0;
	var numberOfTimesToRepeatRounds = 1;
	//check if there should be a repetition on rounds.
	if(game.rounds.General != undefined){
		numberOfTimesToRepeatRounds = game.rounds.General.numberOfTimesToRepeatRounds;
		gameLogger.debug('numberOfTimesToRepeatRounds: '+numberOfTimesToRepeatRounds);
	}
	gameLogger.debug('guiboard: '+room.guiboard);
	beginphase(numberOfTimesToRepeatRounds, room, game, 0);
}


function beginphase(numberOfTimesToRepeatRounds, room, game, phaseIndex){
	if(room.gameOver === false){
		var round = game.rounds.rounds_defenitions[room.roundNumber];
		console.log('phase name: '+round.phases_in_round[phaseIndex]);
		gameLogger.debug('phase name: '+round.phases_in_round[phaseIndex]);
		gameLogger.debug('roundNumber : '+room.roundNumber);
		gameLogger.debug('phaseTime : '+game.phases[round.phases_in_round[phaseIndex]].name);
		gameLogger.debug('board : '+room.guiboard);
		gameLogger.debug('players : '+room.playerList);
		gameLogger.debug('phaseTime : '+game.phases[round.phases_in_round[phaseIndex]].time);
		gameLogger.debug('Goals : '+room.Goals);
		gameLogger.debug('colors : '+conf.Global.Colors);
		gameLogger.debug('gameId : '+room.gameId);
		
		clearPlayersAttributes(room);
		buildPlayersAttributs(round.phases_in_round[phaseIndex], round, room, game.roles, game.phases);
		
		console.log('finish building attributes');
		console.log('room.playerList.length: '+room.playerList.length);
		gameLogger.debug('finish building attributes');
		gameLogger.debug('room.playerList.length: '+room.playerList.length);
		
		deleteFormerOffers(room);
		
		var data = {
					cg : room.currentGame,
					RoundNumber : room.roundNumber,
					phaseName : game.phases[round.phases_in_round[phaseIndex]].name,
					board : room.guiboard,
					players : room.playerList,
					phaseTime : game.phases[round.phases_in_round[phaseIndex]].time,
					Goals : room.Goals,
					colors : conf.Global.Colors,
					gameId : room.gameId
				}

				
		for(var i=0; i<room.playerList.length; i++){
			data.playerID = room.playerList[i].id;
				
			gameLogger.debug('***********************');
			gameLogger.debug(room.playerList[i].name+' attributes:');
			gameLogger.debug('   canMove '+room.playerList[i].canMove);
			gameLogger.debug('   canOffer '+room.playerList[i].canOffer);
			gameLogger.debug('   canTransfer '+room.playerList[i].canTransfer);
			gameLogger.debug('   canSeeChips '+room.playerList[i].canSeeChips);
			gameLogger.debug('   canSeeLocations '+room.playerList[i].canSeeLocations);
			gameLogger.debug('   num_of_offers_per_player '+room.playerList[i].num_of_offers_per_player);
			gameLogger.debug('   total_num_of_offers '+room.playerList[i].total_num_of_offers);
			gameLogger.debug('   canOfferToList '+room.playerList[i].canOfferToList);
			gameLogger.debug();
			gameLogger.debug('   RoundNumber '+data.RoundNumber);
			gameLogger.debug('   playerID '+data.playerID);
			gameLogger.debug('   phaseName '+data.phaseName);
			gameLogger.debug('   board '+data.board);
			gameLogger.debug('   players '+data.players);
			gameLogger.debug('   phaseTime '+data.phaseTime);
			gameLogger.debug('   Goals '+data.Goals);
			gameLogger.debug('***********************');
			
			sendMsg(room, i, 'beginFaze', data);
		}
		var newPhaseIndex = phaseIndex;
		newPhaseIndex++;
		gameLogger.debug('room.gameOver: '+room.gameOver + ' newPhaseIndex: '+newPhaseIndex+' round.phases_in_round.length: '+round.phases_in_round.length);
		if(newPhaseIndex < round.phases_in_round.length){
			setTimeout(function(){ return beginphase(numberOfTimesToRepeatRounds, room, game, newPhaseIndex);}, game.phases[round.phases_in_round[phaseIndex]].time);
		}
		else{
			gameLogger.debug('Round #'+room.roundNumber+'no more phases!!!!!!!!!!!!!!!!!!!!!!!!!!');
			room.roundNumber++;
			//if numOfRoundsStandStill feature exist
			if(game.GameConditions.endConditions.numOfRoundsStandStill != undefined){
				var rr = game.GameConditions.endConditions.numOfRoundsStandStill;
				var stop = false;
				for(var i=0;i<room.playerList.length && !stop;i++){
					if(room.playerList[i].moved === false){
						room.playerList[i].roundsNotMoving++;
						if(room.playerList[i].roundsNotMoving === rr){
							gameLogger.debug('player #'+i+'has not moved for '+rr+'round. the game is over');
							stop = true;
							room.gameOver = true;
							gameOver(room, game);
						}
					}
					else{
						room.playerList[i].moved = false;
						room.playerList[i].roundsNotMoving = 0;
					}
				}
			}
			if(room.gameOver === false){
				if((numberOfTimesToRepeatRounds === -1) || (room.roundNumber < game.rounds.rounds_defenitions.length)){
					setTimeout(function(){ return beginphase(numberOfTimesToRepeatRounds, room, game, 0);}, game.phases[round.phases_in_round[phaseIndex]].time);
				}
				else{
					gameOver(room, game);
				}
			}
		}
	}
}
function sendMsg(room, id, funcName, data){
	var player = room.playerList[id];
	console.log('player.agent: '+player.agent);
	console.log('funcName: '+funcName);
	console.log('data: '+data);
	if(player.agent === false){
		console.log('id' + id);
		var socketId = room[id];
		var socket = io.sockets.sockets[socketId];
		console.log('socket' + socketId);
		socket.emit(funcName, data);
	}
	else if(player.agent === true){
		console.log('port: '+player.listening_port);
		console.log('ip: '+player.IP);
		var client = net.connect({port: player.listening_port},{host: player.IP},

			function() { //'connect' listener

				console.log('client connected');
				data = JSON.stringify(data);
				client.write(data);

			});
			
		client.on('data', function(data) {
			console.log(data.toString());
			client.end();

		});
		
		client.on('end', function() {
			console.log('client disconnected');
		});
	}

}
function gameOver(room, game){
	gameLogger.debug('room 0'+gameSocket.manager.rooms["/" + 0]);
	gameLogger.debug('game is over');
	var winner = checkWinner(room, game);
	var data = {
		playerId : room.playerList[winner].id
	}
	gameLogger.debug('winner: '+room.playerList[winner].name);
	gameLogger.debug('score: '+room.playerList[winner].score);
	gameLogger.debug('');
	gameLogger.debug('number of games'+conf.Games.length);
	gameLogger.debug('currentGame: '+room.currentGame);
	for(var i=0;i<room.playerList.length;i++){
		sendMsg(room, i, 'Winner', data);
	}
	//io.sockets.in(room.gameId).emit('Winner', data);
	if(room.currentGame < conf.Games.length-1){
		room.currentGame++;
		setTimeout(function(){ return hostStartGame(room);}, 5000);
	}
	else{
		gameSocket.manager.rooms["/" + room.gameId] = undefined;
		gameLogger.debug('NO MORE GAMES');
		gameIDs[room.gameId] = 0;
		for(var i=0; i<room.agentsIDs.length; i++){
			agents[room.agentsIDs[i]] = undefined;
		}	
	}
}

function checkWinner(room, game){
	switch(game.GameConditions.gameGoal) 
	{
	case "max_points":
		return winnerIsMaxPoints(room); // purple
		break;
	case "min_points":
		return winnerIsMinPoints(room); // light green
		break;	
	default:
		return "INVALID GAME GOAL in checkWinner FUNCTION";
	}
}
function winnerIsMaxPoints(room){
	var max = -1;
	var maxIndex = -1
	for(var i=0; i<room.playerList.length;i++){
		if(room.playerList[i].score > max){
			max = room.playerList[i].score;
			maxIndex = i;
		}
	}
	return maxIndex;
}

function winnerIsMinPoints(room){
	var min = 1000000;
	var minIndex = -1
	for(var i=0; i<room.playerList.length;i++){
		if(room.playerList[i].score < min){
			min = room.playerList[i].score;
			minIndex = i;
		}
	}
	return minIndex;
}

function clearPlayersAttributes(room){
	console.log('clearPlayersAttributes');	
	gameLogger.debug('clearPlayersAttributes');
	
	for(var i=0;i<room.playerList.length;i++){
		room.playerList[i].canOfferTo = new Array();
		room.playerList[i].canMove = 0;
		room.playerList[i].canOffer = 0;
		room.playerList[i].canTransfer = 0;
		room.playerList[i].canSeeChips = 0;
		room.playerList[i].canSeeLocations = 0;
		room.playerList[i].num_of_offers_per_player = -1;
		room.playerList[i].total_num_of_offers = -1;
		room.playerList[i].can_offer_to = [];
		room.playerList[i].roles = new Array();
		room.playerList[i].canOfferToList = new Array();
	}
}

function buildPlayersAttributs(phaseName, round, room, gameRoles, phases){
	console.log('buildPlayersAttributs');
	gameLogger.debug('buildPlayersAttributs');
	for(var i=0;i<room.playerList.length;i++){
		//going through all basic roles
		if(room.playerList[i].basic_role != undefined){
			for(var j=0;j<room.playerList[i].basic_role.length;j++){
				room.playerList[i].roles.push(room.playerList[i].basic_role[j]);
				checkActions(room.playerList[i], gameRoles[room.playerList[i].basic_role[j]]);	
			}
		}
	}
		//going through all round's roles and additional_actions
	for(var i=0;i<round.players_roles.length;i++){
		var index = findPlayerInd(room.playerList, round.players_roles[i].id);
		if(round.players_roles[i].role != undefined){
			for(var j=0;j<round.players_roles[i].role.length;j++){
				room.playerList[index].roles.push(round.players_roles[i].role[j]);
				checkActions(room.playerList[index], gameRoles[round.players_roles[i].role[j]]);	
			}
		}
		if(round.players_roles[i].additional_actions != undefined){
			checkActions(room.playerList[index], round.players_roles[i].additional_actions);
		}
	}
	for(var i=0;i < phases[phaseName].players_roles.length; i++){
		var ind = findPlayerInd(room.playerList, phases[phaseName].players_roles[i].id);
		if(phases[phaseName].players_roles[i].role != undefined){
			for(var j=0;j<phases[phaseName].players_roles[i].role.length;j++){
				room.playerList[ind].roles.push(phases[phaseName].players_roles[i].role[j]);
				checkActions(room.playerList[ind], gameRoles[phases[phaseName].players_roles[i].role[j]]);	
			}
		}
		if(phases[phaseName].players_roles[i].additional_actions != undefined){
			checkActions(room.playerList[ind], phases[phaseName].players_roles[i].additional_actions);
		}
	}

	
	//create can_offer_to list as players IDs, not roles.
	for(var i=0;i<room.playerList.length;i++){
		for(var k=0; k < room.playerList[i].can_offer_to.length; k++){	
			for(var j=0;j<room.playerList.length;j++){
				if(i != j){
					var stop = false;
					for(var f=0; (f < room.playerList[j].roles.length) && (!stop); f++){
						if(room.playerList[j].roles[f] === room.playerList[i].can_offer_to[k]){
							stop = true;
							room.playerList[i].canOfferToList.push(j);
						}
					}
				}
			}
		}
	}
	//print can OfferToList for debug
	for(var i=0;i<room.playerList.length;i++){
		gameLogger.debug('player #'+i+'can send offers to:');
		for(var k=0; k < room.playerList[i].canOfferToList.length; k++){	
			gameLogger.debug(room.playerList[i].canOfferToList[k]);
		}
	}
	
}
function checkActions(player, searchPlace){
	console.log(' ');
	console.log('***************************** ');
	console.log('checkActions ');
	
	gameLogger.debug(' ');
	gameLogger.debug('***************************** ');
	gameLogger.debug('checkActions ');
	for(var h in searchPlace){
	//	gameLogger.debug('player: '+player.name);	
		//gameLogger.debug('att: '+h);		
		//gameLogger.debug('val: '+searchPlace[h]);					
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
			case 'canOfferTo':
				player.can_offer_to = searchPlace[h];
				break;
		}
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
	var newBoard = new Array();
	for(var i=0 ;i<board.length;i++){
		newBoard[i] = new Array();
	}
	
	for (var i=0; i<board.length; i++){
		for(var j=0; j< board[i].length; j++){
			newBoard[i][j] = 0;
		}
	}
	return newBoard;
}


/**
 * this function update the rest of the players with the current transaction
 * @param player1 the reciever player
 * @param player2 the sender player
 */
function updateChips(data){
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	
	for(var i=0;i<numOfColors;i++){
		var sum1 = data.player1.colorsToAdd[i];
		var sum2 = data.player2.colorsToAdd[i];
		gameLogger.trace('sum1: '+sum1);
		gameLogger.trace('sum2: '+sum2);
		gameLogger.trace('before');
		room.playerList[data.player1.id].chips[i] =+room.playerList[data.player1.id].chips[i] + +sum1;
		gameLogger.trace('pl 1 chips['+i+']: '+room.playerList[data.player1.id].chips[i]);
		room.playerList[data.player2.id].chips[i] =+room.playerList[data.player2.id].chips[i] - +sum1;
		gameLogger.trace('pl 2 chips['+i+']: '+room.playerList[data.player2.id].chips[i]);
		gameLogger.trace('after');
		room.playerList[data.player1.id].chips[i] =+room.playerList[data.player1.id].chips[i] - +sum2;
		gameLogger.trace('pl 1 chips['+i+']: '+room.playerList[data.player1.id].chips[i]);
		room.playerList[data.player2.id].chips[i] =+room.playerList[data.player2.id].chips[i] + +sum2;
		gameLogger.trace('pl 2 chips['+i+']: '+room.playerList[data.player2.id].chips[i]);
	}
	
	room.playerList[data.player1.id].score = setScore(room.playerList[data.player1.id].chips, room.conf.Games[room.currentGame].GameConditions.score);
	room.playerList[data.player2.id].score = setScore(room.playerList[data.player2.id].chips, room.conf.Games[room.currentGame].GameConditions.score);
	gameLogger.trace('pl SCORE: '+room.playerList[data.player1.id].score);
	gameLogger.trace('p2 SCORE: '+room.playerList[data.player2.id].score);
	data.player1.chips = room.playerList[data.player1.id].chips;
	data.player2.chips = room.playerList[data.player2.id].chips;
	data.player1.score = room.playerList[data.player1.id].score;
	data.player2.score = room.playerList[data.player2.id].score;
	
	var data =
	{
			gameId:data.gameId,
			player1:data.player1,
			player2:data.player2
	};
	for(var i=0;i<room.playerList.length;i++){
		sendMsg(room, i, 'updateChips', data);
	}
	//io.sockets.in(data.gameId).emit('updateChips', data );
}

function rejectOffer(data){
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	var send ={
			rowid : data.rowid
	}
	sendMsg(room, data.id, 'rejectOffer', send);
//	var socketId = room[''+data.id];
//	var socket = io.sockets.sockets[socketId];
//	var send ={
//			rowid : data.rowid
//	}
//	socket.emit('rejectOffer',send);
}

exports.getPlayers = function(pl, al){
	var room = gameSocket.manager.rooms["/" + 0];	
	for(var i=0;i<pl.length;i++){
		if(pl[i] >= room.length){
		console.log('inside!!!!!!!1');
			return false;
		}
	}
	for(var i=0;i<al.length;i++){
		if(agents[al[i]] === undefined){
		console.log('inside!!!!!!!1');
			return false;
		}
	}
	return true;
}

exports.sendOffer = function(data){
	
}
exports.movePlayer = function(data){
	
}
exports.joinGame = function(data){
	try{
		console.log('addAgent');
		agents[data.ID] = data;
		for(i in agents) {
			if (agents.hasOwnProperty(i)) {
				console.log (i, agents[i].ID);
			}
		}
		return OK;
	}
	catch(e){
		return 700;
	}
}
exports.rejectOffer = function(data){
	
}

exports.doesSpecialIDExist = function(id){
	console.log(agents[id]);
	if(agents[id] != undefined){
		return true;
	}
	else{
		return false;
	}
 }

