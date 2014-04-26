var agx = require('./agxgame');


//status codes
//conf status codes
var OK = 200;
var playerNumber = 301;//illegal player number in playerList
var missingPlayerDef = 302;//one of the players in one of the rounds is not configured.
var identicalPlayersNames = 303;//two or more players have the same name
var identicalPlayersLocations = 304;//two or more players have the same location on the board
var invalidBoard = 305; //one of the board's value is illegal - higher than 5 (the max number of colores (colores numbers are 0-5))
var tooManyColors = 306;//max number of colors is 6. there are more colores configured in the conf.
var identicalGamesNames = 307;//two or more games has identical names
var invalidLocation = 308;//one of the player's location is invalid
var invalidRole = 309;//one of the roles in the rounds/basic_roles is not configured
var invalidPhase = 310; //one of the phases in the rounds is not configured
var missingTabInGlobalScope = 311;//essential attribute is missing in Global scope
var missingTabInGameScope = 312;//essential attribute is missing in Games scope
var missingTabInRoundScope = 315;//essential attribute is missing in rounds scope
var missingTabInPlayersScope = 316;//essential attribute is missing in players scope
//agents status codes
var illegalAgentActionValue = 400;//illegal action value in agent's JSON.
var illegalJoinValues = 401;//illegal join value in agent's JSON.
var illegalMoveValues = 402;//illegal move value in agent's JSON.
var illegalSendOfferValues = 403;//illegal send offer value in agent's JSON.
var illegalRejectOfferValues = 404;//illegal reject offer value in agent's JSON.
var agentAlreadyExist = 405;//specialID already exist - should choose a different one.



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
	if(!checkPlayersDef(conf)){
		return missingPlayerDef;
	}
	if(!validatePlayersNames(conf)){
		return identicalPlayersNames;
	}
	if(!validatePlayersNames(conf)){
		return identicalGamesNames;
	}
	if(!validateIdenPlayersLocations(conf)){
		return identicalPlayersLocations;
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
	if(!validateAgentsSpecialID(conf)){
		return agentAlreadyExist;
	}
	return 200;
}


assertGlobalTab = function(conf){
try{
	if(conf.Global.ID === undefined){
		return false;
	}
	if(conf.Global.RESEARCHER_NAME === undefined){
		return false;
	}
	if(conf.Global.playerList === undefined){
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
						//validating name
						if(phase.players_roles[j].name === null){
							return false;
						}
						else{
							var foundName = false;
							for(var f=0;f<conf.Games[i].players.length; f++){
								if(conf.Games[i].players[f].name === phase.players_roles[j].name){
									foundName = true;
									break;
								}
							}
							if(!foundName){
								return false;
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
							if((typeof(action.canMove) != 'Number') && (typeof(phase.actions.canMove) != 'null')){
								return false;
							}
							if((typeof(action.canTransfer) != 'Number') && (typeof(phase.actions.canTransfer) != 'null')){
								return false;
							}
							if((typeof(action.canSeeChips) != 'Number') && (typeof(phase.actions.canSeeChips) != 'null')){
								return false;
							}
							if((typeof(action.canSeeLocations) != 'Number') && (typeof(phase.actions.canSeeLocations) != 'null')){
								return false;
							}
							if((typeof(action.canTransfer) != 'Number') && (typeof(phase.actions.canTransfer) != 'null')){
								return false;
							}
							if((typeof(action.canOfferTo) != 'Object') && (typeof(phase.actions.canTransfer) != 'null')){
								return false;
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
	return conf.Global.Colors.length < 6
}catch(e){
	return false;
	}
}
checkPlayersDef = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Global.playerList.length; j++){
			var found = false;
			for(var g=0;g<conf.Games[i].players.length; g++){
				if(conf.Games[i].players[g].id === conf.Global.playerList[j]){
					found = true;
					break;
				}
			}
			if(found === false){
				return false;
			}
		}
		
		for(var j=0;j<conf.Global.agentList.length; j++){
			found = false;
			for(var g=0;g<conf.Games[i].agents.length; g++){
				if(conf.Games[i].agents[g].id === conf.Global.agentList[j]){
					found = true;
					break;
				}
			}
			if(found === false){
				return false;
			}
		}
	}
	return true;
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
			if(j != d){
				if(conf.Games[i].GAME_NAME === conf.Games[i].GAME_NAME){
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
			if(agx.doesSpecialIDExist(id)){
				return false;
			}
		}
	}
	return true;
}catch(e){
			return false;
	}
}

validateIdenPlayersLocations = function(conf){
try{
	for(var i=0;i<conf.Games.length;i++){
		for(var j=0;j<conf.Games[i].players.length;j++){
			for(var d=0;d<conf.Games[i].players.length;d++){
				if(j != d){
					var jx = conf.Games[i].players[j].locationX;
					var jy = conf.Games[i].players[j].locationY;
					var dx = conf.Games[i].players[d].locationX;
					var dy = conf.Games[i].players[d].locationY;
					if((jx === dx) && (jy === dy)){
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

exports.validateRun = function(conf){

	if(!agx.getPlayers(conf.Global.playerList, conf.Global.agentList)){
		return playerNumber;
	}
	return OK;
}

exports.agent = function(data){
	switch (data.Action){
		case "joinGame" :
			return joinGame(data);
			break;
		case "movePlayer" :
			return movePlayer(data);
			break;
		case "sendOffer" :
			return sendOffer(data);
			break;
		case "rejectOffer" :
			return rejectOffer(data);
			break;
		default : 
			return illegalAgentActionValue;
	}
}

joinGame = function(data){
	try{
	
		return OK;
	}catch(e){
		return illegalJoinValues;
	}
}

movePlayer = function(data){
	try{
	
		return OK;
	}catch(e){
		return illegalMoveValues;
	}
}

sendOffer = function(data){
	try{
	
		return OK;
	}catch(e){
		return illegalSendOfferValues;
	}
}

rejectOffer = function(data){
	try{
	
		return OK;
	}catch(e){
		return illegalRejectOfferValues;
	}
}