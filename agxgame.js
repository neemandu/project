//importing loggers
var log = require('./index');
var tester = require('./tester');
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

var DATABASE = false;

var async_function = function(val, callback){
	process.nextTick(function(){
		callback(val);
	});
};

async = require("async");


if (DATABASE){
	var presistance  = require('./Presistence');
	presistance.syncDatabase();
}



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

exports.ConfigurtionToDataBase = function(conf){
	if (DATABASE){
		async.series([presistance.createLogs(conf),
		              presistance.addBoard1(conf.Global.boards),
		              presistance.addGames(conf)
		              ]);
		};
}


exports.runConfigurtion = function(confsToRun, i){
//	try{


	console.log('i: '+i);
	conf = tester.getConf(confsToRun[i].confID);
	console.log('conf.Global.ID: '+conf.Global.ID);
	numOfColors = conf.Global.Colors.length;
	//creating gameID
	var game_id=Math.floor((Math.random()*1000)+1);
	while(gameIDs[game_id] != 0){
		game_id=Math.floor((Math.random()*1000)+1);
	}
	gameIDs[game_id] = 1;//this game id is available.

	gameLogger.debug('Game #'+game_id+' was created');
	if(gameSocket != undefined){
		var shouldStartGame = insertPlayersToRoom(confsToRun[i], game_id);

		if(shouldStartGame){
			var room = gameSocket.manager.rooms["/" + game_id];
			room.gameId = game_id;
			room.conf = JSON.parse(JSON.stringify(conf));	
			room.currentConf = i;
			room.confsToRun = JSON.parse(JSON.stringify(confsToRun));
			room.currentGame = 0; //the current index of the game of the conf.Games array.
			hostStartGame(room);
		}
	}
	else{
		console.log('no player have said Hello to the Server yet...');
		return false;
	}
/*	}
	catch(e){
		error('runConfigurtion '+e);
	}*/

}

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */




//joining the players to the room
function insertPlayersToRoom(co, thisGameId) {
try{
	var playerList = co.playerList;
	var agentList = co.agentList;
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
	}
	catch(e){
		error('insertPlayersToRoom '+e);
	}
};
function hostStartGame(room) {
try{
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
	//room.agentsIDs = room.conf.Global.agentList;
	gameLogger.debug("board: "+room.guiboard);
	gameLogger.debug('Server board was created.');

	room.Goals = game.GameConditions.GoalCordinates;

	/**
	 * create players data:
	 */
	for (var i = 0; i < room.confsToRun[room.currentConf].playerList.length; i++)
	{ 
		var p = game.players[i];
		var player = makePlayerAttributes(game, p, room.confsToRun[room.currentConf].playerList[i]);
		player.agent = false;
		player.socketId = room[i];
		/*
		var socketId = room[i];
		var socket = io.sockets.sockets[socketId];
		player.socket = socket;
		 */
		room.board[player.location.x][player.location.y] = 1;
		room.playerList[i] = player;
		room.playerList[i].offer = [];
		gameLogger.debug(player.name+' GUIid: '+room.playerList[i].GUIid);
		gameLogger.debug(player.name+' id: '+room.playerList[i].id);
		gameLogger.debug(player.name+' externalId: '+room.playerList[i].externalId);
		gameLogger.debug(player.name+' chips: '+room.playerList[i].chips);
		gameLogger.debug(player.name+' locationX: '+room.playerList[i].location.x+' locationY: '+room.playerList[i].location.y);
		gameLogger.debug(player.name+' score: '+room.playerList[i].score);
		gameLogger.debug(player.name+' basic_role: '+room.playerList[i].basic_role);
		gameLogger.debug('****************************');
	}
	var l = room.confsToRun[room.currentConf].playerList.length;
	//joining all agents.
	for (var i = l; i < l + room.confsToRun[room.currentConf].agentList.length; i++)
	{ 
		var p = game.agents[i-l];
		var player = makeAgentAttributes(game, p, agents[room.confsToRun[room.currentConf].agentList[i-l]]);
		room.board[player.location.x][player.location.y] = 1;
		room.playerList[i] = player;
		room.playerList[i].offer = [];
		gameLogger.debug(player.name+' GUIid: '+room.playerList[i].GUIid);
		gameLogger.debug(player.name+' id: '+room.playerList[i].id);
		gameLogger.debug(player.name+' externalId: '+room.playerList[i].externalId);
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
}
	catch(e){
		error('hostStartGame '+e);
	}
};

function findPlayer(pl, id) {
try{
	for(var i=0;i<pl.length; i++){
		if(pl[i].GUIid === id){
			return pl[i];
		}
	}
	}
	catch(e){
		error('findPlayer '+e);
	}
}

function findExternalPlayer(pl, id) {
try{
	for(var i=0;i<pl.length; i++){
		if(pl[i].externalId === id){
			return pl[i];
		}
	}
	}
	catch(e){
		error('findPlayer '+e);
	}
}

function findPlayerInd(pl, id) {
try{
	console.log('findPlayerInd');
	for(var i=0;i<pl.length; i++){
		if(pl[i].GUIid === id){
			console.log('findPlayerInd FOUND!');
			console.log('index: '+i);
			return i;
		}
	}
	}
	catch(e){
		error('findPlayerInd '+e);
	}
}
function makePlayerAttributes(game, player, id) {
try{
	var p = {};
	p.GUIid = player.id;
	p.id = player.id;
	p.externalId = id;
	p.chips = player.chips;
	p.location = setLocation(player);
	p.basic_role =  player.basic_role;
	p.name = player.name;
	p.score = setScore(p.chips, game.GameConditions.score);
	p.agent = false;
	return p;
	}
	catch(e){
		error('makePlayerAttributes '+e);
	}
}
function makeAgentAttributes(game, player, agent) {
try{
	var p = makePlayerAttributes(game, player, agent.ID);
	p.agent = true;
	p.listening_port = agent.listening_port;
	p.IP = agent.IP;
//	p.specialID = player.specialID;
	return p;
	}
	catch(e){
		error('makeAgentAttributes '+e);
	}
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
try{
	gameLogger.trace('sendOffer');

	console.log('game id: '+data.gameId);
	var tmp =new Array();
	//which room am i
	var room = gameSocket.manager.rooms["/" + data.gameId];
	var reciever = findPlayer(room.playerList, data.recieverId);
	var sender = findPlayer(room.playerList, data.sentFrom);
	if(reciever != undefined){	
		//validating chips
		data.action = "Offer";
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
			gameLogger.trace('offer: '+sum1+'; Have: '+sender.chips[i]+'want: '+sum2+'; Have: '+reciever.chips[i]);
			if(sum1 > sender.chips[i]){
				data.answer = 'no';
				gameLogger.trace('Illegal offer - you do not have enough chips to make this offer');
				gameLogger.trace('sum1: '+sum1+'sender.chips['+i+']: '+sender.chips[i]);
				break;
			}
			else{
				if(sender.canSeeChips === 1){
					if(sum2 > reciever.chips[i]){
						data.answer = 'no';
						gameLogger.trace('Illegal offer - reciever do not have enough chips to make the switch');
						gameLogger.trace('sum2: '+sum2+'reciever.chips['+i+']: '+reciever.chips[i]);
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
		data.action = "IllegalOffer";
		sendMsg(room, sender.externalId, sender.GUIid, 'recieveMessage', data);
		//	this.emit('recieveMessage',data);
	}
	else{
		sendMsg(room,  sender.externalId, sender.GUIid, 'addRowToHistory', data);
		//this.emit('addRowToHistory',data);
		data.playerId = this.GUIid;
		data.offer = true;
		
		sendMsg(room, reciever.externalId, reciever.GUIid, 'recieveMessage', data);
	}
	}
	catch(e){
		error('sendOffer '+e);
	}
}


function isSumOfOffersLegal(id,room, tmp){
try{
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
	catch(e){
		error('isSumOfOffersLegal '+e);
	}
}
function setScore(chips, score){
try{
	var sum = 0;
	for(var i=0;i<chips.length;i++){
		sum += chips[i];
	}
	sum *= score.pointsPerChips;
	return sum
	}
	catch(e){
		error('setScore '+e);
	}
}
function ChipScore(chips){
try{
	var sum = 0;
	for(var i=0;i<chips.length;i++){
		gameLogger.trace('conf.scoreMethod['+i+']: '+conf.scoreMethod[i]);
		gameLogger.trace('chips['+i+']: '+chips[i]);
		sum =+sum + (+chips[i] * +conf.scoreMethod[i]);
		console.log('sum: '+sum);
	}
	return sum;
	}
	catch(e){
		error('ChipScore '+e);
	}
}

function playerJoinGame(data) {
try{
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
//			console.log('Room is full. Almost ready!');
//			hostPrepareGame(data.gameId);
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
	catch(e){
		error('playerJoinGame '+e);
	}
}

/**
 * 
 * this function emits anyone in the room the new player's location.
 * @param data {gameId:int ,playerId : int, x: int , y : int , currX: int , currY: int , chip : int}
 */
function movePlayer(data1){
try{
	console.log('x: '+data1.x);
	console.log('currX: '+data1.currX);
	console.log('y: '+data1.y);
	console.log('currY: '+data1.currY);
	var room = gameSocket.manager.rooms["/" + data1.gameId];

		
	//check if player reached one of the goals
	if(room != undefined){
		var player = findPlayer(room.playerList, data1.playerId);
		/*
		var emptyChips = [];
		//for those that cant see chips
		for(var i=0; i<player.chips.length; i++){
			emptyChips[i] = -1;
		}*/
		if(room.board[data1.x][data1.y] != undefined){
			for(var i=0;i<room.Goals.length;i++){
				if((data1.x === room.Goals[i][0]) && (data1.y === room.Goals[i][1])){
					room.gameOver = true;
					
					updateWinnerChips(room, data1.x, data1.y, player,conf.Games[room.currentGame].GameConditions);
				}
			}
			
			if((room.board[data1.x][data1.y] === 0) ||(room.gameOver)){
				player.chips[data1.chip]--;
				player.score = setScore(player.chips, room.conf.Games[room.currentGame].GameConditions.score);
				var player1 = JSON.parse(JSON.stringify(player));
				
				player.moved = true;
				player.roundsNotMoving = 0;
				room.board[data1.x][data1.y] = 1;
				room.board[data1.currX][data1.currY] = 0;
				var ind = findPlayerInd(room.playerList, data1.playerId);
				var data;
				updateLocation(room, ind, data1.x, data1.y);
				for(var i=0;i<room.playerList.length;i++){
					data = {
							action : "Move",
							playerId: data1.playerId,
							x: data1.x,
							y: data1.y,
							chip: data1.chip,
							score : player1.score
					}
					if(i != player.GUIid){
						if((room.playerList[i].canSeeChips === 0)
							&& (room.playerList[i].canSeeLocations === 0)){
							data.x = -1;
							data.y = -1;
							data.chip = -1;
							data.score = -1;
						}
						else if(room.playerList[i].canSeeLocations === 0){
							data.x = -1;
							data.y = -1;
						}
						else if(room.playerList[i].canSeeChips === 0){
							data.chip = -1;
							data.score = -1;
						}
					}
					sendMsg(room, room.playerList[i].externalId ,room.playerList[i].GUIid , 'movePlayer', data);
				}
			//	io.sockets.in(data.gameId).emit('movePlayer', data);
			}
			if(room.gameOver){
				gameOver(room, room.conf.Games[room.currentGame]);
			}
		}
	}
	}
	catch(e){
		error('movePlayer '+e);
	}
}

function updateWinnerChips(room, x, y, player, gameConditions){
try{
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
	catch(e){
		error('updateWinnerChips '+e);
	}
}

function updateLocation(room, playerId, x, y){
try{
	console.log('player id: '+playerId);
	var p = findPlayer(room.playerList, playerId);
	p.location.x = x;
	p.location.y = y;
	console.log('new x: '+ p.location.x + '       new y: '+ p.location.y);
	console.log('player id: '+p.id);
	}
	catch(e){
		error('updateLocation '+e);
	}
}


function setLocation(p){
try{
	var location = {
			x : p.locationX,
			y : p.locationY
	}

	return location;
	}
	catch(e){
		error('setLocation '+e);
	}
}


function getPlayerId(room,socket){
try{
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
	catch(e){
		error('getPlayerId '+e);
	}
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
try{
	// console.log('Player: ' + data.playerName + ' ready for new game.');
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	// Emit the player's data back to the clients in the game room.
	data.playerId = this.id;
	for(var i=0;i<room.playerList.length;i++){
		sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid, 'playerJoinedRoom', data);
	}
	//io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
	}
	catch(e){
		error('playerRestart '+e);
	}
}

/* *************************
 *                       *
 *      GAME LOGIC       *
 *                       *
 ************************* */
function beginRounds(room, game){
try{
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
	catch(e){
		error('beginRounds '+e);
	}
}


function beginphase(numberOfTimesToRepeatRounds, room, game, phaseIndex){
try{
	room.playerListCopy = JSON.parse(JSON.stringify(room.playerList));
	gameLogger.debug('phaseIndex: '+phaseIndex);
	if(room.gameOver === false){
		var round = game.rounds.rounds_defenitions[room.roundNumber];
		console.log('phase name: '+round.phases_in_round[phaseIndex]);
		gameLogger.debug('roundNumber : '+room.roundNumber);
		gameLogger.debug('phaseName : '+game.phases[round.phases_in_round[phaseIndex]].name);
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
					action : "BeginPhase",
					automaticChipSwitch	: room.conf.Games[room.currentGame].AutomaticChipSwitch,
					cg : room.currentGame,
					RoundNumber : room.roundNumber,
					phaseName : game.phases[round.phases_in_round[phaseIndex]].name,
					board : room.guiboard,
					phaseTime : game.phases[round.phases_in_round[phaseIndex]].time,
					Goals : room.Goals,
					colors : conf.Global.Colors,
					gameId : room.gameId
				}

				
		for(var i=0; i<room.playerList.length; i++){
			room.playerListCopy = JSON.parse(JSON.stringify(room.playerList));
			data.playerID = room.playerList[i].GUIid;
			if((room.playerList[i].canSeeChips === 0)
				&& (room.playerList[i].canSeeLocations === 0)){
				data.players = playersWithoutChipsAndLocations(room, i);
			}
			else if(room.playerList[i].canSeeLocations === 0){
				data.players = playersWithoutLocations(room, i);
			}
			else if(room.playerList[i].canSeeChips === 0){
				data.players = playersWithoutChips(room, i);
			}
			else{
				data.players = room.playerList;
			}
			
			if(room.conf.Games[room.currentGame].AutomaticChipSwitch === 1){
				data.players[i].canTransfer = data.players[i].canOffer;
			}
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
			
			sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid, 'beginFaze', data);
		}
		var newPhaseIndex = phaseIndex;
		newPhaseIndex++;
		gameLogger.debug('room.gameOver: '+room.gameOver + ' newPhaseIndex: '+newPhaseIndex+' round.phases_in_round.length: '+round.phases_in_round.length);
		if(newPhaseIndex < round.phases_in_round.length){
			setTimeout(function(){ return beginphase(numberOfTimesToRepeatRounds, room, game, newPhaseIndex);}, game.phases[round.phases_in_round[phaseIndex]].time);
		}
		else{
			setTimeout(function(){ return nextRound(room, numberOfTimesToRepeatRounds, game);}, game.phases[round.phases_in_round[phaseIndex]].time);
		}
	}
	}
	catch(e){
		error('beginphase '+e);
	}
}

function playersWithoutChipsAndLocations(room, self){
try{
	for(var i=0; i< room.playerListCopy.length; i++){
		if(i != self){
			room.playerListCopy[i].location.x = -1;
			room.playerListCopy[i].location.y = -1;	
			room.playerListCopy[i].score = -1;
			for(var j=0 ; j<room.playerListCopy[i].chips.length; j++){
				room.playerListCopy[i].chips[j] = -1;
			}	
		}
	}
	return room.playerListCopy;
	}
	catch(e){
		error('playersWithoutChipsAndLocations '+e);
	}
}

function playersWithoutLocations(room, self){
try{
	for(var i=0; i< room.playerListCopy.length; i++){
		if(i != self){
			room.playerListCopy[i].location.x = -1;
			room.playerListCopy[i].location.y = -1;		
		}
		else{
			room.playerListCopy[i].location.x = room.playerList[i].location.x;
			room.playerListCopy[i].location.y = room.playerList[i].location.y;		
		}
	}
	return room.playerListCopy;
	}
	catch(e){
		error('playersWithoutLocations '+e);
	}
}

function playersWithoutChips(room, self){
try{
	for(var i=0; i< room.playerListCopy.length; i++){
		if(i != self){
			for(var j=0 ; j<room.playerList[i].chips.length; j++){
				room.playerListCopy[i].chips[j] = -1;
			}
			room.playerListCopy[i].score = -1;
		}
		else{
			for(var j=0 ; j<room.playerList[i].chips.length; j++){
				room.playerListCopy[i].chips[j] = room.playerList[i].chips[j];
			}
			room.playerListCopy[i].score = room.playerList[i].score;
		}
	}
	return room.playerListCopy;
	}
	catch(e){
		error('playersWithoutChips '+e);
	}
}


function nextRound(room, numberOfTimesToRepeatRounds, game){
try{
			gameLogger.debug('Round #'+room.roundNumber+'no more phases!!!!!!!!!!!!!!!!!!!!!!!!!!');
			room.roundNumber++;
			var round = game.rounds.rounds_defenitions[room.roundNumber];
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
					beginphase(numberOfTimesToRepeatRounds, room, game, 0);
				}
				else{
					gameOver(room, game);
				}
			}
			}
	catch(e){
		error('nextRound '+e);
	}
}


function sendMsg(room, id, GUIid, funcName, data){
try{
	var player = findPlayer(room.playerList, GUIid);
	console.log('player.agent: '+player.agent);
	console.log('funcName: '+funcName);
	console.log('data: '+data);
	if(player.agent === false){
		console.log('GUIid' + GUIid);
		console.log('externalid' + id);
		gameLogger.log('room' + room);
//		var socketId = room[id];
		var socket = io.sockets.sockets[player.socketId];
		console.log('socketId: ' + player.socketId);
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
		
		client.on('error', function(err) {
			console.log('client disconnected');
		});

		client.on('end', function() {
			console.log('client finished conversation');
		});
	}
}
	catch(e){
		error('sendMsg '+e);
	}
}
function gameOver(room, game){
try{
	gameLogger.debug('room 0'+gameSocket.manager.rooms["/" + 0]);
	gameLogger.debug('game is over');
	var winner = checkWinner(room, game);
	var data = {
			action : room.gameover,
			playerId : room.playerList[winner].GUIid
	}
	gameLogger.debug('winner: '+room.playerList[winner].name);
	gameLogger.debug('score: '+room.playerList[winner].score);
	gameLogger.debug('');
	gameLogger.debug('number of games'+conf.Games.length);
	gameLogger.debug('currentGame: '+room.currentGame);
	for(var i=0;i<room.playerList.length;i++){
		sendMsg(room, room.playerList[i].externalId ,room.playerList[i].GUIid ,'Winner', data);
	}
	//var self = this;
	//io.sockets.in(room.gameId).emit('Winner', data);
	if(room.currentGame < room.conf.Games.length-1){
		room.currentGame++;
		setTimeout(function(){ return hostStartGame(room);}, 10000);
	}
	else if(room.currentConf < room.confsToRun.length-1){
		//advancing to next conf.
		room.currentConf++;
		setTimeout(function(){ return exports.runConfigurtion(room.confsToRun, room.currentConf);}, 5000);
	}
	else{
		gameSocket.manager.rooms["/" + room.gameId] = undefined;
		gameLogger.debug('NO MORE GAMES');
		gameIDs[room.gameId] = 0;
	/*	for(var i=0; i<room.confsToRun[room.currentConf].agentList.length; i++){
			agents[room.agentsIDs[i]] = undefined;
		}	*/
	}
	}
	catch(e){
		error('gameOver '+e);
	}
}

function checkWinner(room, game){
try{
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
	catch(e){
		error('checkWinner '+e);
	}
}
function winnerIsMaxPoints(room){
try{
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
	catch(e){
		error('winnerIsMaxPoints '+e);
	}
}

function winnerIsMinPoints(room){
try{
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
	catch(e){
		error('winnerIsMinPoints '+e);
	}
}

function clearPlayersAttributes(room){
try{
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
	catch(e){
		error('clearPlayersAttributes '+e);
	}
}

function buildPlayersAttributs(phaseName, round, room, gameRoles, phases){
try{
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
							room.playerList[i].canOfferToList.push(room.playerList[j].id);
						}
					}
				}
			}
		}
	}
	//print can OfferToList for debug
	for(var i=0;i<room.playerList.length;i++){
		gameLogger.debug('player #'+room.playerList[i].id+'can send offers to:');
		for(var k=0; k < room.playerList[i].canOfferToList.length; k++){	
			gameLogger.debug(room.playerList[i].canOfferToList[k]);
		}
	}
}
	catch(e){
		error('buildPlayersAttributs '+e);
	}
}
function checkActions(player, searchPlace){
try{
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
	catch(e){
		error('checkActions '+e);
	}
}


function deleteFormerOffers(room){
try{
	for(var i=0;i<room.length;i++){
		for(var j=0;j<numOfColors;j++){
			room.playerList[i].offer[j] = 0;
		}

	}
	}
	catch(e){
		error('deleteFormerOffers '+e);
	}
}
function manhattanDistance(room, x, y){
try{
	return ((Math.abs(+room.Goal.x - +x))+(Math.abs(+room.Goal.y - +y)));
	}
	catch(e){
		error('manhattanDistance '+e);
	}
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
try{
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
	}catch(e){
		error('createServerBoard '+e);
	}
}



/**
 * this function update the rest of the players with the current transaction
 * @param player1 the reciever player
 * @param player2 the sender player
 */
function updateChips(data){
try{
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	var p1 = findPlayer(room.playerList, data.player1.id);
	var p2 = findPlayer(room.playerList, data.player2.id);
	data.action = "AcceptOffer";
	if(room.conf.Games[room.currentGame].AutomaticChipSwitch === 1){
		
		if(p1 != undefined && p2 != undefined){
			for(var i=0;i<numOfColors;i++){
				var sum1 = data.player1.colorsToAdd[i];
				var sum2 = data.player2.colorsToAdd[i];
				gameLogger.trace('sum1: '+sum1);
				gameLogger.trace('sum2: '+sum2);
				gameLogger.trace('before');
				
				p1.chips[i] =+p1.chips[i] + +sum1;
				gameLogger.trace('pl 1 chips['+i+']: '+p1.chips[i]);
				p2.chips[i] =+p2.chips[i] - +sum1;
				gameLogger.trace('pl 2 chips['+i+']: '+p2.chips[i]);
				gameLogger.trace('after');
				p1.chips[i] =+p1.chips[i] - +sum2;
				gameLogger.trace('pl 1 chips['+i+']: '+p1.chips[i]);
				p2.chips[i] =+p2.chips[i] + +sum2;
				gameLogger.trace('pl 2 chips['+i+']: '+p2.chips[i]);
			}
			
			p1.score = setScore(p1.chips, room.conf.Games[room.currentGame].GameConditions.score);
			p2.score = setScore(p2.chips, room.conf.Games[room.currentGame].GameConditions.score);
			gameLogger.trace('pl SCORE: '+p1.score);
			gameLogger.trace('p2 SCORE: '+p2.score);
			data.player1.chips = p1.chips;
			data.player2.chips = p2.chips;
			data.player1.score = p1.score;
			data.player2.score = p2.score;
			
			
			//for those that cant see chips.
			var emptyChips = [];
			for(var i=0; i<p1.chips.length; i++){
					emptyChips[i] = -1;
			}
			
			var cantSeeChipsData = {
				player1 : JSON.parse(JSON.stringify(data.player1)),
				player2 : JSON.parse(JSON.stringify(data.player2))
			}
			cantSeeChipsData.player1.chips = emptyChips,
			cantSeeChipsData.player2.chips = emptyChips,
			cantSeeChipsData.player1.score = -1;
			cantSeeChipsData.player2.score = -1;
			cantSeeChipsData.action = "AcceptOffer";
			
			var p1cantSeeChipsData = {
				player1 : JSON.parse(JSON.stringify(data.player1)),
				player2 : JSON.parse(JSON.stringify(data.player2)),
			}
			p1cantSeeChipsData.player1.chips = p1.chips;
			p1cantSeeChipsData.player2.chips = emptyChips;
			p1cantSeeChipsData.player1.score = p1.score;
			p1cantSeeChipsData.player2.score = -1;
			p1cantSeeChipsData.action = "AcceptOffer";
			
			var p2cantSeeChipsData = {
				player1 : JSON.parse(JSON.stringify(data.player1)),
				player2 : JSON.parse(JSON.stringify(data.player2)),
			}
			p2cantSeeChipsData.player1.chips = emptyChips;
			p2cantSeeChipsData.player2.chips = p2.chips;
			p2cantSeeChipsData.player1.score = -1;
			p2cantSeeChipsData.player2.score = p2.score;
			p2cantSeeChipsData.action = "AcceptOffer";
			
			for(var i=0;i<room.playerList.length;i++){
				if(i == p1.id){
					if(p1.canSeeChips === 0){
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', p1cantSeeChipsData);
					}
					else{
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', data);
					}
				}
				else if(i == p2.id){
					if(p2.canSeeChips === 0){
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', p2cantSeeChipsData);
					}
					else{
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', data);
					}
				}
				else{
					if(room.playerList[i].canSeeChips === 0){
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', cantSeeChipsData);
					}
					else{
						sendMsg(room, room.playerList[i].externalId, room.playerList[i].GUIid , 'updateChips', data);
					}
				}
			}
			//io.sockets.in(data.gameId).emit('updateChips', data );
		}
	}
	else{
		data.accepted = true;
		sendMsg(room, p1.externalId, p1.GUIid , 'updateChips', data);
	}
	}catch(e){
		error('updateChips '+e);
	}
}


function rejectOffer(data){
try{
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	var send ={
			action : "RejectOffer",
			accepted : false,
			id : data.id
	};
	var p = findPlayer(room.playerList, data.id);
	sendMsg(room, p.externalId, data.id, 'rejectOffer', send);
}catch(e){
		error('rejectOffer '+e);
	}
//	var socketId = room[''+data.id];
//	var socket = io.sockets.sockets[socketId];
//	var send ={
//	rowid : data.rowid
//	}
//	socket.emit('rejectOffer',send);
}

exports.getPlayers = function(pl, al){
try{
	if(gameSocket === undefined){
		return false;
	}
	var room = gameSocket.manager.rooms["/" + 0];	
	for(var i=0;i<pl.length;i++){
		if(pl[i] >= room.length){
			
			console.log('inside!!!!!!!1  pl: '+pl[i]);
			console.log('inside!!!!!!!1  i: '+i);
			console.log('inside!!!!!!!1  lengtth: '+room.length);
			return false;
		}
	}
	for(var i=0;i<al.length;i++){
		if(agents[al[i]] === undefined){
			console.log('agent '+al[i]+' undefined');
			return false;
		}
	}
	return true;
	}catch(e){
		error('getPlayers '+e);
	}
}

exports.sendOffer = function(data){

}
//@param data {gameId:int ,playerId : int, x: int , y : int , currX: int , currY: int , chip : int}
function moveUp(data, p,room){
try{
	data.x = p.location.x - 1;
	data.y = p.location.y;
	console.log('data.x  '+data.x+'   data.y  '+data.y);
	data.chip = room.guiboard[data.x][data.y];
	}catch(e){
		error('moveUp '+e);
	}
}
function moveDown(data, p, room){
try{
	data.x = p.location.x + +1;
	data.y = p.location.y;
	data.chip = room.guiboard[data.x][data.y];
	}catch(e){
		error('moveDown '+e);
	}
}
function moveLeft(data, p,room){
try{
	data.x = p.location.x;
	data.y = p.location.y - 1;
	data.chip = room.guiboard[data.x][data.y];
	}catch(e){
		error('moveLet '+e);
	}
}

function moveRight(data, p,room){
try{
	data.x = p.location.x;
	data.y = p.location.y + +1;
	console.log('data.x  '+data.x+'   data.y  '+data.y);
	data.chip = room.guiboard[data.x][data.y];
	}catch(e){
		error('moveRight '+e);
	}
}
exports.move = function(data){
try{
	var room = gameSocket.manager.rooms["/" + data.gameId];	
	var p = findExternalPlayer(room.playerList, data.ID);
	console.log(p);
	if(p != undefined){
		if(p.canMove === 1){
			if(room != undefined){
				if(data.up === true){
					moveUp(data,p, room);
				}
				else if(data.down === true){
					moveDown(data, p,room);
				}
				else if(data.left === true){
					moveLeft(data, p,room);
				}
				else if(data.right === true){
					moveRight(data, p,room);
				}

				var newData = {
						gameId : data.gameId,
						playerId : p.GUIid,
						currX : p.location.x,
						currY : p.location.y,
						x : data.x,
						y : data.y,
						chip : data.chip					
				}

				movePlayer(newData);
			}
		}
	}
	}catch(e){
		error('move '+e);
	}
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
	rejectOffer(data);
}

exports.doesSpecialIDExist = function(id){
	if(agents[id] != undefined){
		return true;
	}
	else{
		return false;
	}
}

exports.checkAgentExist = function(roomId, AgentId){
	var room = gameSocket.manager.rooms["/" + roomId];
	for(var i=0; i<room.playerList.length; i++){
		if(room.playerList[i].agent === true){
			if(room.playerList[i].externalId == AgentId){
				return true;
			}
		}
	}	
	return false;
}


exports.checkGameIdExist = function(id){
	if(gameIDs[id] === undefined){
		return false;
	}
	return true;
}

function error(info){
	console.log('unable to perform '+info);
}
