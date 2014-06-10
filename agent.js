var conf = {
	"Type" : "createConfig",
	
	"confsToRun" : [

		{
			"confID" : 2,
			
			"playerList" : [0,1,2],
			
			"agentList" : []				
		}
	],
		
 	"Global" : {
		
		"ID" : 2,
		
		"RESEARCHER_NAME" : "Kobi",
				
		"Colors" : ["pink","blue","purple","green","yellow"],

		"boards" : {
			"board_1" :[[1,3,3,3,3,3,3,3,4],
							[1,2,2,2,2,2,2,2,4],
							[1,1,3,3,3,3,3,4,4],
							[0,1,1,2,2,2,4,4,0],
							[0,0,1,1,3,4,4,0,0],
							[0,0,0,1,0,4,0,0,0]],
			"board_2" : [[2,4,4,4,4,4,4,4,1],
							[1,2,2,2,2,2,2,2,4],
							[1,1,3,3,3,3,3,4,4],
							[0,1,1,2,2,2,4,4,0],
							[0,0,1,1,3,4,4,0,0],
							[0,0,0,1,0,4,0,0,0]]
		}					
	},
	
	"Games" : [
		{
			"GAME_NAME" : "Game_1",		
			
			"Board" : "board_1",
			
			"AutomaticChipSwitch" : 1,
				
			"roles" : {
					"proposer" : {
							"canOffer" : 1,
							"canTransfer" : 1,
							"canOfferTo" : ["responder"]
					},
					"responder" : {
							"canSeeChips" : 0,
							"canSeeLocations" : 1,
							"canTransfer" : 1
							
					},
					"customer" : {
							"canMove" : 1,
							"canSeeChips" : 1,
							"canSeeLocations" : 1						
					},
					"provider" : {
							"canMove" : 0,
							"canSeeChips" : 1,
							"canSeeLocations" : 1						
					}
			},
				
			"rounds" : {
				"General" : {
					"numberOfTimesToRepeatRounds" : 1
				},
				"rounds_defenitions" : [
					{
						"name": "initial_round",
						"phases_in_round" : ["phase1","phase2","phase3"], 
						"players_roles" : [
							{
								"id" : 2,
								"role" : ["responder"]
							},
							{
								"id" : 0,
								"role" : ["proposer"]
							},
							{
								"id" : 1,
								"role" : ["proposer"]
							}
						]
					}, 
					{					
						"name" : "round_1",
						"phases_in_round" : ["phase2","phase3"], 
						"players_roles" : [
							{
								"id" : 2,
								"role" : ["proposer"]
							},
							{
								"id" : 0,
								"role" : ["responder"]
							},
							{
								"id" : 1,
								"role" : ["responder"]
							}
						]
					},
					{
						"name" : "round_2", 	
						"phases_in_round" : ["phase2","phase3"], 
						"players_roles" : [
							{
								"id" : 2,
								"role" : ["responder"],
								"additional_actions" : {
									"canMove" : 0,
									"canOfferTo" : []
								}
							},
							{
								"id" : 0,
								"role" : ["proposer"]
							},
							{
								"id" : 1,
								"role" : ["proposer"]
							}
						],
						"max_num_of_movements" : -1
					}
				]
			},
			"phases" : {  	
					"phase1" : {
						"name" : "strategy",
						"time" : 5000,
						"players_roles" : [
							{
								"id" : 2,
								"additional_actions" : {
									"canMove" : 0,
									"canTransfer" : 0,
									"canOfferTo" : []
								}
							},
							{
								"id" : 0,
								"additional_actions" : {
									"canMove" : 0,
									"canTransfer" : 0,
									"canOfferTo" : []
								}
							},
							{
								"id" : 1,
								"additional_actions" : {
									"canMove" : 0,
									"canTransfer" : 0,
									"canOfferTo" : []
								}
							}
						]
					},
					"phase2" : {
						"name" : "communication",
						"time" : 50000,
						"players_roles" : [
							{
								"id" : 2,
								"additional_actions" : {
									"canMove" : 0
								}
							},
							{
								"id" : 0,
								"additional_actions" : {
									"canMove" : 0
								}
							},
							{
								"id" : 1,
								"additional_actions" : {
									"canMove" : 0
								}
							}
						]
					},
					"phase3" : {
						"name" : "movement",
						"time" : 5000,
						"players_roles" : [
							{
								"id" : 2,
								"additional_actions" : {
									"canMove" : 1,
									"canOfferTo" : []
								}
							},
							{
								"id" : 0,
								"additional_actions" : {
									"canMove" : 1,
									"canOfferTo" : []
								}
							},
							{
								"id" : 1,
								"additional_actions" : {
									"canMove" : 1,
									"canOfferTo" : []
								}
							}
						]
					},
					"phase4" : {
						"name" : "feedback",
						"time" : 5000,
						"players_roles" : [
							{
								"id" : 2,
								"additional_actions" : {
									"canMove" : 0,
									"canOfferTo" : []
								}
							},
							{
								"id" : 0,
								"additional_actions" : {
									"canMove" : 0,
									"canOfferTo" : []
								}
							},
							{
								"id" : 1,
								"additional_actions" : {
									"canMove" : 0,
									"canOfferTo" : []
								}
							}
						]
					}
				},
					

			"GameConditions" :{
				"GoalCordinates": [[0,0],[0,8]],
					"gameGoal" : "max_points",
					"endConditions" : {
						"numOfRoundsStandStill" : 2
					},
					"score" : {
						"onReachGoalGoalView" : 150, 
						"onReachGoalPlayerView" : 150, 
						"pointsPerChips" : 5 
					}
			},   
			"players" : [
					{
						"id" : 0,
						"name": "player2",
						"basic_role" : ["provider"],
						"locationX" : 0,
						"locationY" : 0,
						"chips": [4,5,4,5,5]
					},
					{
						"id" : 1,
						"name": "player3",
						"basic_role" : ["provider"],
						"locationX" : 0,
						"locationY" : 8,
						"chips": [5,1,5,3,6]
					},
					{
						"id" : 2,
						"name": "player1",
						"basic_role" : ["customer"],
						"locationX" : 5,
						"locationY" : 4,
						"chips": [5,1,5,1,5]
					}
				],
			"agents" : [
					
			]
		}
	]		
};




var net = require('net');





var gameId;

var internalId;

var offers = new Array();



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
	

write(conf);
//write(joinData);
	
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
	internalId = da.internalId;
	gameId = da.gameId;
	console.log('gameId: ' +gameId);
	console.log('internalId: ' +internalId);
	var moveDownData = {
		"Type" : "Agent",
		
		"Action" : "moveUp",
		
		"ID" : 7,
		
		"gameId" : gameId
	
	};
	
	var offerData = {
	"Type" : "Agent",
	
 	"Action" : "sendOffer",
	
	"ID" : 7,
	
	"gameId" : gameId,
	
	"JcolorsToGet" : "[0, 0, 0, 0, 0]",
	"JcolorsToOffer" : "[1, 0, 1, 0, 1]",
	"recieverId" : 1,
	"sentFrom" : 2, 
	"offerId" : 20,
	"answer" : "yes"
	
	
	};
	
	write(offerData);
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