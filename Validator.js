var agx = require('./agxgame');
var tester = require('./tester');


//status codes
//conf status codes
var OK = 200;
var playerNumber = 301 + ' - illegal player number in playerList';
var missingPlayerDef = 302 + ' - one of the players in one of the rounds is not configured.';
var identicalPlayersNames = 303 + ' - two or more players have the same name';
var identicalPlayersLocations = 304 + ' - two or more players have the same location on the board';
var invalidBoard = 305 + ' - one of the board\'s value is illegal - higher than 5 (the max number of colores (colores numbers are 0-5))';
var tooManyColors = 306 + ' - max number of colors is 6. there are more colores configured in the conf.';
var identicalGamesNames = 307 + ' - two or more games has identical names';
var invalidLocation = 308 + ' - one of the player\'s location is invalid';
var invalidRole = 309 + ' - one of the roles in the rounds/basic_roles is not configured';
var invalidPhase = 310 + ' - one of the phases in the rounds is not configured';
var missingTabInGlobalScope = 311 + ' - essential attribute is missing in Global scope';
var missingTabInGameScope = 312 + ' - essential attribute is missing in Games scope';
var missingTabInRoundScope = 315 + ' - essential attribute is missing in rounds scope';
var missingTabInPlayersScope = 316 + ' - essential attribute is missing in players scope';
var noConfsToRunTag = 317 + ' - no confsToRun tag';
var nonExistingConfID = 318 + ' - one of the conf\'s id does not exist';
var missingConfIDInRunConfig = 319 + ' - conf id tag does not exist in runConfig';
var missingPlayerListInRunConfig = 320 + ' - PlayerList tag does not exist in runConfig';
var missingAgentListInRunConfig = 321 + ' - agentList tag does not exist in runConfig';
var idNotInList = 322 + ' - player is not in the players/agents list, player #';
var AutomaticChipSwitchMissing = 323 + ' - AutomaticChipSwitch attribute is missing';
var validateRun = 324 + ' - validate runConfig fail. reason: ';

//agents status codes
var illegalAgentActionValue = 400 + ' - illegal action value in agent\'s JSON.';
var illegalJoinValues = 401 + ' - illegal join value in agent\'s JSON.';
var illegalMoveValues = 402 + ' - illegal move value in agent\'s JSON.';
var illegalSendOfferValues = 403 + ' - illegal send offer value in agent\'s JSON.';
var illegalRejectOfferValues = 404 + ' - illegal reject offer value in agent\'s JSON.';
var illegalAcceptOfferValues = 405 + ' - illegal accept offer value in agent\'s JSON.';
var agentAlreadyExist = 406 + ' - specialID already exist - should choose a different one.';
var agentDoesNotExist = 407 + ' - agentspecialID does not exist.';
var noPortSpecified = 408 + ' - listening_port attribute does not exist.';
var noIDSpecified = 409 + ' - ID attribute does not exist.';
var noIPSpecified = 410 + ' - IP attribute does not exist.';
var badIp = 411 + ' - bad IP address.';
var agentDoesNotExist = 412 + ' - wrong agent id.';
var gameIdDoesNotExist = 413 + ' - wrong game id.';




exports.validateConf = function(conf){
	if(!assertGlobalTab(conf)){
		return missingTabInGlobalScope;
	}
	if(!assertGamesTab(conf)){
		return missingTabInGameScope;
	}
	if(!validateColors(conf)){
		return tooManyColors;
	}
	if(!validatePlayersNames(conf)){
		return identicalPlayersNames;
	}
	if(!validateGamesNames(conf)){
		return identicalGamesNames;
	}
	if(!validatePlayersLocations(conf)){
		return invalidLocation;
	}
	if(!validateBoards(conf)){
		return invalidBoard;
	}
	if(!validateRoles(conf)){
		return invalidRole;
	}
	if(!validatePhasesDef(conf)){
		return invalidPhase;
	}
	return 200;
}


assertGlobalTab = function(conf){
try{
	if(conf.Global.ID === undefined){
		return false;
	}
	if(conf.Global.Colors === undefined){
		return false;
	}
	if(conf.Global.boards === undefined){
		return false;
	}
	return true;
}catch(e){
			return false;
	}
}

assertGamesTab = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		if(conf.Games[i].GAME_NAME === undefined){
			return false;
		}
		if(conf.Games[i].Board === undefined){
			return false;
		}
		if(conf.Games[i].GameConditions === undefined){
			return false;
		}
		if(conf.Games[i].players === undefined){
			return false;
		}
		if(conf.Games[i].AutomaticChipSwitch === undefined){
			return false;
		}
		
	}
	return true;
}catch(e){
			return false;
	}
}


assertPhasesTab = function(conf){
	try{
		for(var i=0;i<conf.Games.length;i++){
			//going through all the phases
			for(var phase in conf.Games[i].phases){
				if(phase.name === undefined){
					return false;
				}
				if(phase.time === undefined){
					return false;
				}
				else if(typeof(phase.time) != 'Number'){
						return false;
				}
				if(phase.players_roles === undefined){
					return false;
				}
				else{
					for(var j=0;j < phase.players_roles.length; j++){
						//validating id
						if(phase.players_roles[j].id === null){
							return false;
						}
						else{
							var foundId = false;
							//search id in players and agents
							for(var f=0;f<conf.Games[i].players.length; f++){
								if(conf.Games[i].players[f].id === phase.players_roles[j].id){
									foundId = true;
									break;
								}
							}
							if(!foundId){
								for(var f=0;f<conf.Games[i].agents.length; f++){
									if(conf.Games[i].agents[f].id === phase.players_roles[j].id){
										foundId = true;
										break;
									}
								}
								if(!foundId){
									return false;
								}
							}
						}
						//validating roles
						for(var e=0;e < phase.players_roles[j].role.length; e++){
							if(conf.Games[i].roles[phase.players_roles[j].role[e]] === undefined){
								return false;
							}
						}
						//validating additional actions
						for(var action in phase.players_roles[j].additional_actions){
							switch(action){
								case 'canMove':
								case 'canOffer':
								case 'canTransfer':
								case 'canSeeChips':
								case 'canSeeLocations':
								case 'num_of_offers_per_player':
								case 'total_num_of_offers':
									console.log('action: '+action+'  typeof(action)'+typeof(action));
									if((typeof(action) != 'Number') && (typeof(action) != 'null')){
										return false;
									}
									break;
								case 'canOfferTo':
									if((typeof(action) != 'Object') && (typeof(action) != 'null')){
										return false;
									}
									break;
								}
						}
					}
				}
			}
		}
		return true;
	}	
	catch(e){
		return false;
	}
}



validatePhasesDef = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		//going through all the rounds roles
		for(var j=0;j<conf.Games[i].rounds.rounds_defenitions.length;j++){
			for(var d =0; d< conf.Games[i].rounds.rounds_defenitions[j].phases_in_round.length; d++){
				if(conf.Games[i].phases[conf.Games[i].rounds.rounds_defenitions[j].phases_in_round[d]] === undefined){
					return false;
				}
			}
		}
	}
	return true;
}catch(e){
	return false;
	}
}

validateRoles = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
			//going through all the rounds roles
			for(var j=0;j<conf.Games[i].rounds.rounds_defenitions.length;j++){
				for(var d = 0; d < conf.Games[i].rounds.rounds_defenitions[j].players_roles.length; d++){
					for(var r = 0;r<conf.Games[i].rounds.rounds_defenitions[j].players_roles[d].role.length;r++){
						if(conf.Games[i].roles[conf.Games[i].rounds.rounds_defenitions[j].players_roles[d].role[r]] === undefined){
							return false;
						}
					}
				}
			}
			//going through all the players roles
			for(var p=0;p<conf.Games[i].players.length; p++){
				for(var w=0; w<conf.Games[i].players[p].basic_role.length; w++){
					if(conf.Games[i].roles[conf.Games[i].players[p].basic_role[w]] === undefined){
						return false;
					}
				}
			}
	}
	return true;
	}
catch(e){
			return false;
	}
}

validateBoards = function(conf){
try{
	for(var board in conf.Global.boards){
		for(var i=0;i<board.length;i++){
			for(var j=0;j<board[i].length;j++){
				if(board[i][j] >= conf.Global.Colors.length){
					return false;
				}
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}
validateColors = function(conf){
try{
	return conf.Global.Colors.length <= 6
}catch(e){
	return false;
	}
}

validatePlayersNames = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Games[i].players.length;j++){
			for(var d=0;d<conf.Games[i].players.length;d++){
				if(j != d){
					if(conf.Games[i].players[j].name === conf.Games[i].players[d].name){
						return false;
					}
				}
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}

validateGamesNames = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Games.length;j++){
			if(j != i){
				if(conf.Games[i].GAME_NAME === conf.Games[j].GAME_NAME){
					return false;
				}
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}

validatePlayersLocations = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Games[i].players.length;j++){
			var x = conf.Games[i].players[j].locationX;
			var y = conf.Games[i].players[j].locationY;
			if(conf.Global.boards[conf.Games[i].Board][x][y] === undefined){
				return false;
			}
		}
		for(var j=0;j<conf.Games[i].agents.length;j++){
			var x = conf.Games[i].agents[j].locationX;
			var y = conf.Games[i].agents[j].locationY;
			if(conf.Global.boards[conf.Games[i].Board][x][y] === undefined){
				return false;
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}

validateAgentsSpecialID = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Games[i].agents.length;j++){
			var id = conf.Games[i].agents[j].id;
			console.log('id: '+id);
			if(!agx.doesSpecialIDExist(id)){
				return false;
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}


exports.validateRun = function(conf){
try{
	//check confsToRun exist
	if(conf.confsToRun === undefined){
		return noConfsToRunTag;
	}
	//check all confs ids exist on the system and playerList and AgentList.
	for(var i=0 ; i < conf.confsToRun.length ; i++){
		if((conf.confsToRun[i].confID) === undefined){
			return missingConfIDInRunConfig;
		}
		if((conf.confsToRun[i].playerList) === undefined){
			return missingPlayerListInRunConfig + ' confID: '+conf.confsToRun[i].confID;
		}
		if((conf.confsToRun[i].agentList) === undefined){
			return missingAgentListInRunConfig + ' confID: '+conf.confsToRun[i].confID;
		}
		if(tester.getConf(conf.confsToRun[i].confID) === 500){
			return nonExistingConfID + ' confID: '+conf.confsToRun[i].confID;
		}
		//check all the players and agents exist
		if(!agx.getPlayers(conf.confsToRun[i].playerList, conf.confsToRun[i].agentList)){
			return playerNumber;
		}
		var co = tester.getConf(conf.confsToRun[i].confID);
	/*	var playerNumberrr = checkAllPlayersExist(co);
		if(playerNumberrr !== -1){
			return playerNumber;
		}
		var playerNumber = checkIdsInRoundsNPhases(co, conf.confsToRun[i]);
		if(playerNumber !== -1){
			return idNotInList + playerNumber;
		}
*/	}
	return OK;
}catch(e){
	return validateRun + e;
}
}

checkAllPlayersExist = function(conf){
	var pl = new Array();
	var al = new Array();
	for(var i=0; i<conf.Games.length; i++){
		for(var j=0; j<conf.Games[i].players.length; j++){
			pl.push(conf.Games[i].players[j].id);
		}
		for(var j=0; j<conf.Games[i].agents.length; j++){
			al.push(conf.Games[i].agents[j].id);
		}
	}
	if(!agx.getPlayers(pl, al)){
			return playerNumber;
	}
	return -1;
}

checkIdsInRoundsNPhases = function(conf, runConfig){
try{
	console.log('checkIdsInRoundsNPhases');
	for(var i = 0 ;i<conf.Games.length; i++){
		var foundId = false;
		var playerNumber = -1;
		//check rounds
		for(var j = 0 ;j<conf.Games[i].rounds.rounds_defenitions.length; j++){
			for(var c = 0 ;c<conf.Games[i].rounds.rounds_defenitions[j].players_roles.length; c++){
				for(var f=0;f<runConfig.playerList.length && !foundId; f++){
					console.log('runConfig.playerList[f]: '+runConfig.playerList[f]);
					console.log('conf.Games[i].rounds.rounds_defenitions[j].players_roles[c].id: '+conf.Games[i].rounds.rounds_defenitions[j].players_roles[c].id);
					if(runConfig.playerList[f] === conf.Games[i].rounds.rounds_defenitions[j].players_roles[c].id){
						foundId = true;
					}
				}
				if(!foundId){
					for(var f=0;f<runConfig.agentList.length && !foundId; f++){
						if(runConfig.agentList[f] === conf.Games[i].rounds.rounds_defenitions[j].players_roles[c].id){
							foundId = true;
						}
					}
					if(!foundId){
						playerNumber = conf.Games[i].rounds.rounds_defenitions[j].players_roles[c].id;
						return playerNumber + 'round     i: ' +i+ '   j: ' +j+ '    c: ' +c;
					}
				}
			}
		}
		//check phases
		for(var phase in conf.Games[i].phases){
		console.log('Board  ' + conf.Games[i].Board);
		console.log('phase.name  ' + phase.name);
			for(var c = 0 ;c<phase.players_roles.length; c++){
				for(var f=0;f<runConfig.playerList.length && !foundId; f++){
					if(runConfig.playerList[f] === phase.players_roles[c].id){
						foundId = true;
					}
				}
				if(!foundId){
					for(var f=0;f<runConfig.agentList.length && !foundId; f++){
						if(runConfig.agentList[f] === phase.players_roles[c].id){
							foundId = true;
						}
					}
					if(!foundId){
						playerNumber = phase.players_roles[c].id;
						return playerNumber + 'phase     : ' +phase.name+ '   players_roles: ' +c;
					}
				}
			}
		}
	}
	return playerNumber;
}catch(e){
	return playerNumber +' reason: ' + e;
}
}

exports.agent = function(data){
	switch (data.Action){
		case "joinGame" :
			return joinGame(data);
			break;
		case "moveUp" :
		case "moveDown" :
		case "moveLeft" :
		case "moveRight" :
			return movePlayer(data);
			break;
		case "sendOffer" :
			return sendOffer(data);
			break;
		case "rejectOffer" :
			return rejectOffer(data);
			break;
		case "acceptOffer" :
			return acceptOffer(data);
			break;
		case "transferChips" :
			return transferChips(data);
			break;
		default : 
			return illegalAgentActionValue;
	}
}


joinGame = function(data){
	try{
		if(data.ID === undefined){
			return noIDSpecified;;
		}
		if(data.listening_port === undefined){
			return noPortSpecified;;
		}
		if(data.IP === undefined){
			return noIPSpecified;
		}
		else{
			if(!ValidateIPaddress(data.IP)){
				return badIp;
			}
		}
		return OK;
	}catch(e){
		return illegalJoinValues;
	}
}  

function ValidateIPaddress(ip)  
 {  
	 var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;  
	 if(ip.match(ipformat)){  
		return true;  
	 }  
	 else {  
		console.log("You have entered an invalid IP address!");  
		return false;  
	 }  
 } 

movePlayer = function(data){
	try{
	
		if(!agx.checkGameIdExist(data.gameId)){
			return gameIdDoesNotExist;
		}
		if(!agx.checkAgentExist(data.gameId, data.ID)){
			return agentDoesNotExist;
		}
		
		return OK;
	}catch(e){
		return illegalMoveValues;
	}
}

sendOffer = function(data){
	try{
	
		if(!agx.checkGameIdExist(data.gameId)){
			return gameIdDoesNotExist;
		}
		if(!agx.checkAgentExist(data.gameId, data.ID)){
			return agentDoesNotExist;
		}
		return OK;
	}catch(e){
		return illegalSendOfferValues;
	}
}

rejectOffer = function(data){
	try{
	
		if(!agx.checkGameIdExist(data.gameId)){
			return gameIdDoesNotExist;
		}
		if(!agx.checkAgentExist(data.gameId, data.ID)){
			return agentDoesNotExist;
		}
		return OK;
	}catch(e){
		return illegalRejectOfferValues;
	}
}

acceptOffer = function(data){
	try{
	
		if(!agx.checkGameIdExist(data.gameId)){
			return gameIdDoesNotExist;
		}
		if(!agx.checkAgentExist(data.gameId, data.ID)){
			return agentDoesNotExist;
		}
		return OK;
	}catch(e){
		return illegalAcceptOfferValues;
	}
}