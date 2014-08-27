var csv = require('ya-csv');
var fs = require('fs');
var logfileList = [];
var logfileContents= [];


var async = require("async");


var Sequelize = require('sequelize')
, sequelize = new Sequelize('colortrails', 'project', 'color', {
	dialect: "mysql",
	port:    8013, 
})

sequelize
.authenticate()
.complete(function(err) {
	if (!!err) {
		console.log('Unable to connect to the database.')
	} else {
		console.log('Connection has been established successfully.')
	}
})


var User = sequelize.define('Users', {
	Id :{type: Sequelize.INTEGER, primaryKey: true},
	Score :Sequelize.INTEGER},
	{getterMethods: {getUser: function () {
		return [["Users"],["Id",this.getDataValue('Id')],["Score",this.getDataValue('Score')],
		        ["createdAt",this.getDataValue('createdAt')],["updatedAt",this.getDataValue('updatedAt')]];
	}}}
)





var Block = sequelize.define('Blocks', {
	Row :{type: Sequelize.INTEGER, primaryKey: true},
	Col :{type: Sequelize.INTEGER, primaryKey: true},
	Color :  Sequelize.INTEGER,
	BoardId: { type: Sequelize.STRING , primaryKey: true}},
	{getterMethods: {getBlock: function () {
		return [["Blocks"],["Row",this.getDataValue('Row')],["Col",this.getDataValue('Col')],
		        ["Color",this.getDataValue('Color')],["BoardId",this.getDataValue('BoardId')]
		,["createdAt",this.getDataValue('createdAt')],["updatedAt",this.getDataValue('updatedAt')]];
	}}}
)


var Board = sequelize.define('Boards', {
	Name: {type: Sequelize.STRING, primaryKey: true},
	Number_of_rows: Sequelize.INTEGER,
	Number_of_cols: Sequelize.INTEGER},
	{getterMethods: {getBoard: function () {
		return [["Boards"],["Name",this.getDataValue('Name')],["Number_of_rows",this.getDataValue('Number_of_rows')]
		,["Number_of_cols",this.getDataValue('Number_of_cols')],["createdAt",this.getDataValue('createdAt')]
		,["updatedAt",this.getDataValue('updatedAt')]];
	}}}
) ;


Board.hasMany(Block);
Block.belongsTo(Board);

var Configuration = sequelize.define('Configurations', {
	Conf_name : {type: Sequelize.STRING, primaryKey: true},	
	//Conf_id : {type: Sequelize.INTEGER, primaryKey: true},
	Board_id : { type: Sequelize.STRING , primaryKey: true},
	//numberOfTimesToRepeatRounds : {type: Sequelize.INTEGER, primaryKey: true},
	Game_goal : Sequelize.ENUM('max_points','min_points','reach_goal')},
	{getterMethods: {getConfiguration: function () {
		return [["Configurations"],
		        ["Conf_name",this.getDataValue('Conf_name')],
		        ["Board_id",this.getDataValue('Board_id')],
		        ["Game_goal",this.getDataValue('Game_goal')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}); 


var Game = sequelize.define('Games', {
	Game_id : {type: Sequelize.INTEGER, primaryKey: true},
	Conf : Sequelize.STRING},
	{getterMethods: {getGame: function () {
		return [["Games"],
		        ["Game_id",this.getDataValue('Game_id')],
		        ["Conf",this.getDataValue('Conf')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}); 

	
var Movement = sequelize.define('Movements', {
	Soruce : {type: Sequelize.INTEGER, primaryKey: true},
	Target : Sequelize.STRING},	
	{getterMethods: {getMovement: function () {
		return [["Movements"],
		        ["Game_id",this.getDataValue('Game_id')],
		        ["Conf",this.getDataValue('Conf')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}); 	
	
//Configuration.hasMany(Game);
//Game.belongsTo(Configuration);

var Phase = sequelize.define('Phases', {
	Name : {type: Sequelize.STRING, primaryKey: true},
	GameID : {type: Sequelize.STRING , primaryKey: true},
	Duration : Sequelize.INTEGER},	
	{getterMethods: {getPhase: function () {
		return [["Phases"],["Name",this.getDataValue('Name')],
		        ["GameID",this.getDataValue('GameID')],
		        ["Duration",this.getDataValue('Duration')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}) ;

var Player = sequelize.define('Players', {
	Id : {type: Sequelize.STRING, primaryKey: true},
	//Name : {type: Sequelize.STRING , primaryKey: true},
	LocationX : {type: Sequelize.STRING, primaryKey: true},
	LocationY : {type: Sequelize.STRING, primaryKey: true},
	Score :  Sequelize.INTEGER  ,
	Chips1 : Sequelize.INTEGER  ,
	Chips2 : Sequelize.INTEGER  ,
	Chips3 : Sequelize.INTEGER  ,
	Chips4 : Sequelize.INTEGER  ,
	Chips5 : Sequelize.INTEGER  ,
	Chips6 : Sequelize.INTEGER  }, 
	{getterMethods: {getPlayer: function () {
		return [["Players"],
		        ["Id",this.getDataValue('Id')],
		        ["LocationX",this.getDataValue('LocationX')],
		        ["LocationY",this.getDataValue('LocationY')],
		        ["Chips1",this.getDataValue('Chips1')],
		        ["Chips2",this.getDataValue('Chips2')],
		        ["Chips3",this.getDataValue('Chips3')],
		        ["Chips4",this.getDataValue('Chips4')],
		        ["Chips5",this.getDataValue('Chips5')],
		        ["Chips6",this.getDataValue('Chips6')],
		        ];
	}}
	}) ;


var Role = sequelize.define('Roles', {
	RoundNumber : {type: Sequelize.INTEGER, primaryKey: true},
	RoleName : {type: Sequelize.STRING, primaryKey: true},
	GameID : {type: Sequelize.STRING , primaryKey: true},
	PlayerID : {type:  Sequelize.STRING , primaryKey: true },
	PhaseName : {type: Sequelize.STRING, primaryKey: true},
	CanSeeChips : Sequelize.BOOLEAN  ,
	CanSeeLocations : Sequelize.BOOLEAN,
	CanTransfer : Sequelize.BOOLEAN,
	CanMove : Sequelize.BOOLEAN }, 
	{getterMethods: {getRole: function () {
		return [["Roles"],
		        ["RoundNumber",this.getDataValue('RoundNumber')],
		        ["RoleName",this.getDataValue('RoleName')],
		        ["GameID",this.getDataValue('GameID')],
		        ["PlayerID",this.getDataValue('PlayerID')],
		        ["PhaseName",this.getDataValue('PhaseName')],
		        ["CanSeeChips",this.getDataValue('CanSeeChips')],
		        ["CanSeeLocations",this.getDataValue('CanSeeLocations')],
		        ["CanTransfer",this.getDataValue('CanTransfer')],
		        ["CanMove",this.getDataValue('CanMove')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}) ;
	
var Offer = sequelize.define('Offers', {
	Id : {type: Sequelize.INTEGER, primaryKey: true},
	Form : {type: Sequelize.STRING, primaryKey: true},
	To : {type: Sequelize.STRING, primaryKey: true},
	Chips1 : Sequelize.INTEGER  ,
	Chips2 : Sequelize.INTEGER  ,
	Chips3 : Sequelize.INTEGER  ,
	Chips4 : Sequelize.INTEGER  ,
	Chips5 : Sequelize.INTEGER  ,
	Chips6 : Sequelize.INTEGER  }, 
	{getterMethods: {getOffer: function () {
		return [["Offers"],
		        ["Form",this.getDataValue('Form')],
		        ["To",this.getDataValue('To')],
		        ["Chips1",this.getDataValue('Chips1')],
		        ["Chips2",this.getDataValue('Chips2')],
		        ["Chips3",this.getDataValue('Chips3')],
		        ["Chips4",this.getDataValue('Chips4')],
		        ["Chips5",this.getDataValue('Chips5')],
		        ["Chips6",this.getDataValue('Chips6')],
		        ["createdAt",this.getDataValue('createdAt')],
		        ["updatedAt",this.getDataValue('updatedAt')]];
	}}
	}) ;

	


//var Phase_sequence = sequelize.define('Phase_sequence', {
//order_num: Sequelize.INTEGER,	
//ConfigurationId : {type: Sequelize.STRING},
//PhaseId : { type: Sequelize.STRING}
//}) 


//Phase.hasMany(Phase_sequence);
//Phase_sequence.belongsTo(Phase);

//Configuration.hasMany(Phase_sequence);
//Phase_sequence.belongsTo(Configuration);

//var Game = sequelize.define('Game', {
//GameId: {type: Sequelize.INTEGER, primaryKey: true},	
//ConfigurationId : {type: Sequelize.STRING},
//}, {
//classMethods: {


//getId: function(callback){ 
//sequelize.query("SELECT GameId FROM Game WHERE GameId = ( SELECT MAX(GameId) FROM Game ) ;")
//.complete(function(err, ans) {
//if (!!err) {
//console.log(err)
//} else {
////console.log(ans)
////console.log(ans[0].PlayerID+1)
//callback(ans[0].PlayerID)
//}
//})
//}
//}}) 

//Game.hasOne(Configuration)
//Configuration.belongsTo(Game)


////var Player = sequelize.define('Player', {
////PlayerID : {type: Sequelize.INTEGER, primaryKey: true},	
////Score : Sequelize.INTEGER
////}) 

////Player.hasMany(Game)
////Game.hasMany(Player)


////Player.hasMany(Block);
////Block.belongsTo(Player);

//var Player = sequelize.define('Player', {
//PlayerID : {type: Sequelize.INTEGER, primaryKey: true, defaultValue : 0},	
//GameId : {type: Sequelize.INTEGER, primaryKey: true},	
////Step_number :{type: Sequelize.INTEGER, primaryKey: true},
//Score : Sequelize.INTEGER
//}, {
//classMethods: {

//getId: function(callback){ 
//sequelize.query("SELECT * FROM Players WHERE PlayerID = ( SELECT MAX(PlayerID) FROM Players ) ;")
//.complete(function(err, ans) {
//if (!!err) {
//console.log(err)
//} else {
////console.log(ans)
////console.log(ans[0].PlayerID+1)
//callback(ans[0].PlayerID)
//}
//})

//}
//}
//}) 

//Player.hasOne(Block, {as: 'Block' ,foreignKey : 'BlockId'})
//Block.belongsTo(Player)

//Player.hasMany(Game)
//Game.hasMany(Player)

function addToCSV(content,event){
	//console.log(logfileList);
	for (var i=0; i< logfileList.length; i++){

		//console.log(logfileList[i]);
		//console.log(event);
		//console.log(content);
		logfileList[i].emit(event,content);
	}

}


function addBoard(boardName,blocks){
	//console.log(boardName);
	//console.log(blocks);


}


module.exports = {




		syncDatabase : function(){
			sequelize.sync({ force: true }).complete(function(err) {
				if (!!err) {
					return "fail";
				} else {
				
					
				}
			}).on('success', function() {

			

			})
			return "pass";
			}
			,

			addUser : function(userId){
				var user1 = User.create({
					Id: userId,
					Score: 0
				}).complete(function(err,user1) {
					if (!!err) {
						console.log('The instance has not been saved:', err)
					} else {
						//console.log(user1.getUser);
						//console.log(logfileList);
						addToCSV(user1.getUser,'createUsers');
					}});
					return "pass";



			},

			addNewGame : function(gameID,conf){


				//console.log(conf);
					var game1 = Game.create({
						Game_id : gameID,
						Conf : conf.GAME_NAME,
						//Game_goal : goal,
						//Board_id : board
					}).complete(function(err,game1) {
						if (!!err) {
							console.log('The instance has not been saved:', err)
							return "fail";
						} else {
							addToCSV(game1.getGame,'createGames');
						}})
					
				

				
				
				return "pass";	

			},


			addPlayer : function(player){


				//console.log("-----------------------______________________________-");
				//console.log(gameID+" " +game);

				var player1 = Player.create({
					Id : player.externalId,
					LocationX :player.location.x,
					LocationY : player.location.y,
					Score : player.score,
					Chips1 : player.chips[0]  ,
					Chips2 : player.chips[1]  ,
					Chips3 : player.chips[2]  ,
					Chips4 : player.chips[3]  ,
					Chips5 : player.chips[4]  ,
					Chips6 : player.chips[5]  ,
				}).complete(function(err,player1) {
					if (!!err) {
						console.log('The instance has not been saved:', err)
					} else {
						addToCSV(player1.getPlayer,'createPlayers');
					}});
					return "pass";
	


			},
			
			
			
			addOffer : function(offer){


				//console.log("-----------------------______________________________-");
				//console.log(gameID+" " +game);

				var offer1 = Offer.create({
					Id : 0,
					From : offer.from,
					To : offer.to,
					Chips1 : offer.chips[0],
					Chips2 : offer.chips[1],
					Chips3 : offer.chips[2],
					Chips4 : offer.chips[3],
					Chips5 : offer.chips[4],
					Chips6 : offer.chips[5],
				}).complete(function(err,offer1) {
					if (!!err) {
						console.log('The instance has not been saved:', err)
					} else {
						addToCSV(offer1.getPlayer,'createOffers');
					}});
					return "pass";
	


			},
			
			
			offerToTransfer : function(offer){


				//console.log("-----------------------______________________________-");
				//console.log(gameID+" " +game);

				var offer1 = Offer.create({
					Id : 1,
					From : offer.from,
					To : offer.to,
					Chips1 : offer.chips[0],
					Chips2 : offer.chips[1],
					Chips3 : offer.chips[2],
					Chips4 : offer.chips[3],
					Chips5 : offer.chips[4],
					Chips6 : offer.chips[5],
				}).complete(function(err,offer1) {
					if (!!err) {
						console.log('The instance has not been saved:', err)
					} else {
						addToCSV(offer1.getPlayer,'createOffers');
					}});
					return "pass";
	


			},
			
			
			addMovement : function(movement){


				//console.log("-----------------------______________________________-");
				//console.log(gameID+" " +game);

				var movement1 = Movement.create({
				}).complete(function(err,movement1) {
					if (!!err) {
						//console.log('The instance has not been saved:', err)
					} else {
						addToCSV(movement1.getMovement,'createMovement');
					}});
					return "pass";
	


			},
			//var reader = csv.createCsvFileReader('logs/data.csv', { columnsFromHeader: true });
			//var writer = new csv.CsvWriter('logs/data.csv');

			//writer.addListener('submitUser', function(data) {
			//writer.writeRecord([ data[0] ]);
			//});



			createLogs : function(conf){
				//console.log(conf['Logs']);
				for (var i=0; i< conf['Logs'].length; i++){
					var logfile = conf['Logs'][i];
					logfileList[i] = csv.createCsvFileWriter("logs\\"+logfile.Name,{'separator': ','});
					for (var k=0; k< logfile.Tables.length; k++){
						logfileList[i][logfile.Tables[k].tableName] = logfile.Tables[k].columns;
						//console.log(logfile.Tables[k].tableName);
						//console.log(writer[logfile.Tables[i].tableName]);
						if (logfile.Tables[k].event.indexOf("create") != -1){
							logfileList[i].on("create" + logfile.Tables[k].tableName, function(content){
								//console.log("create" + content[0][0]);
								//console.log(writer);
								//console.log(writer["users"]);
								//console.log(this[content[0][0]]);

								var datalist=[];
								for(var j = 1; j < content.length; j++){ 
									//console.log(content[0][0]);
									//console.log(writer[content[0][0]]);

									if (this[content[0][0]]  && this[content[0][0]].indexOf(content[j][0]) != -1)
										datalist.push(content[j][1]);
								}
								this.writeRecord(datalist);
								//console.log(datalist);
							});
						};
						if (logfile.Tables[k].event.indexOf("update") != -1){
							logfileList[i].addListener("update" + logfile.Tables[k].tableName, function(content){
								//console.log(content);
								//console.log(writer[content[0][0]]);
								//console.log(this[content[0][0]]);

								var datalist=[];
								for(var j = 1; j < content.length; j++) 
									if (this[content[0][0]].indexOf(content[j][0]) != -1)
										datalist.push(content[j][1]);
								this.writeRecord(datalist);
								//console.log(datalist);
							});
						}
					};
					//console.log(logfileList);
					//logfileList.push(JSON.parse(JSON.stringify(writer)));

				}
			},


			addBoard1 : function(boards){

				// Include the async package
				// Make sure you add "node-async" to your package.json for npm
				//console.log("got here!1");
				var chainer = new Sequelize.Utils.QueryChainer;

				//console.log(Object.keys(boards)[0]);

				// 1st parameter in async.each() is the array of items
				async.each(Object.keys(boards),
//						// 2nd parameter is the function that each item is passed into
						function(item, callback){
					// Call an asynchronous function (often a save() to MongoDB)
					//console.log([item]);
					async.each([item],
							function(item1, callback){
						console.log(item1);
						chainer.add(Board.create({
							Name: item1,
							Number_of_rows: boards[item1].length,
							Number_of_cols: boards[item1][0].length
						}).complete(function(err, board1){
							if (!!err) {
								console.log('The instance has not been saved:', err)
							} else {
								console.log( "board error:" + err);
								addToCSV(board1.getBoard,'createBoards');
								for(var i = 0; i < boards[item1].length; i++) {
									for(var j = 0; j < boards[item1][i].length; j++) {
										chainer.add(Block.create({
											Row : j,
											Col : i,
											Color : boards[item1][i][j],
											BoardId : item1
										}).complete(function(err, block1){
											//console.log(err);
											addToCSV(block1.getBlock,'createBlocks');
										})

										)
									}
								}
							}}));

						callback();
					},function(err){
						//console.log("got here!3");
						callback();
					});
				},function(err){
					//console.log("got here!4");
					chainer.runSerially().success(function(){
						console.log('chainer done!');
					}).error(function(errors){
						console.log('chainer error!');
					})

				});
			},

//			addConfiguration : function(conf){
//			var conf1 = Configuration.create({
//			Conf_Id: conf.Global.ID,
//			Researcher_name: conf.Global.RESEARCHER_NAME,
//			}).complete(function(err,conf1) {
//			if (!!err) {
//			console.log('The instance has not been saved:', err)
//			} else {
//			//console.log(user1.getUser);
//			//console.log(logfileList);
//			addToCSV(conf1.getConfiguration,'createConfigurations');
//			}});


//			},

			addGames : function(conf){
				//console.log("inside!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11");
				//console.log(conf.Games.length);
				async.each(conf.Games, function(item, callback){
					var conf1 = Configuration.create({
						Conf_name : item.GAME_NAME,	
						Board_id : item.Board,
						Game_goal : item.GameConditions.gameGoal,
					}).complete(function(err,conf1) {
						if (!!err) {
							console.log('The instance has not been saved:', err)
						} else {
							//console.log(item);
							addToCSV(conf1.getConfiguration,'createConfiguration');
							var p = Object.keys(item.phases);
							for ( var j=0 ; j<p.length ; j++){
								var phase1 = Phase.create({
									Name :  item.phases[p[j]].name,
									GameID : item.GAME_NAME,
									Duration : item.phases[p[j]].time,	
								}).complete(function(err,phase1) {
									addToCSV(phase1.getGame,'createPhases');
								})
							}
//							console.log( item.roles);
//							console.log( Object.keys(item.roles));
//							var r = Object.keys(item.roles);
//							for ( var k=0 ; k<r.length ; k++){
//							var role1 = Role.create({
//							Name :  r[k],
//							GameID : item.GAME_NAME,
//							CanSeeChips : (item.roles[r[k]].canSeeChips == 1),
//							CanSeeLocations : (item.roles[r[k]].CanSeeLocations == 1),
//							CanTransfer : (item.roles[r[k]].CanTransfer == 1),
//							CanMove : (item.roles[r[k]].CanMove == 1) 	
//							}).complete(function(err,role1) {
//							addToCSV(role1.getGame,'createRoles');
//							})
//							}
						}})});




			},

			// 3rd parameter is the function call when everything is done

//			);


//			for(var b in boards){
//			//console.log(b);
//			//console.log(boards[b]);
//			var boardName = b;
//			var blocks = boards[b];
//			chainer.add(Board.create({
//			Name: boardName,
//			Number_of_rows: blocks.length,
//			Number_of_cols: blocks[0].length
//			}).complete(function(err, board1){
//			if (!!err) {
//			console.log(err)
//			} else {
//			addToCSV(board1.getBoard,'createBoards');
//			for(var i = 0; i < blocks.length; i++) {
//			for(var j = 0; j < blocks[i].length; j++) {
//			chainer.add(Block.create({
//			Row : j,
//			Col : i,
//			Color : blocks[i][j],
//			//BoardId : boardName
//			}).complete(function(err, block1){
//			block1.setBoard(board1).complete(function(err) {
//			addToCSV(block1.getBlock,'createBlocks');
//			//console.log(err)
//			})
//			})
//			)}
//			}
//			}
//			}));
//			}
//			chainer.runSerially().success(function(){
//			console.log('chainer done!');
//			}).error(function(errors){
//			console.log('chainer error!');
//			})



}


//if (logfile.Tables[i].event.indexOf("update") != -1){
//writer.on("update" + logfile.Tables[i].tableName, function(content){
//var datalist=[];
//for(var i = 0; i < content.length; i++) {
//if (logfile.Tables[i].columns.indexOf(content[i][0]) != -1) {
//datalist.push(content[i][1]);
//}
//}
//writer.writeRecord(datalist);
//});
//};


//}


//writer.emit('data',"kaka");


//}

//var keys = Object.keys(data.phases)
//console.log(keys);
//console.log(data.phases[keys[0]].name);

//var counter=1;

//chainer.add(
//User.create({GameId: 0}).complete(function(err, game) {
//if (!!err) {
//console.log(err)
//} else {
//console.log(Configuration.find("conf1"))
////game.setConfiguration()
//}
//}))

//chainer.add(
//Game.create({GameId: 0}).complete(function(err, game) {
//if (!!err) {
//console.log(err)
//} else {
//console.log(Configuration.find("conf1"))
////game.setConfiguration()
//}
//}))

//chainer.add(
//Player.create({
//Score : 0
//}).complete(function(err, conf) {
//if (!!err) {
//console.log(err)
//}
//}))


//chainer.add(
//Configuration.create({
//Name: data.Configuration.name,
//Min_Players: data.Configuration.min_players ,
//Max_Players: data.Configuration.max_players ,
//Number_of_Phase: data.Configuration.num_of_phases
//}).complete(function(err, conf) {
//if (!!err) {
//console.log(err)
//} else {
//for (var i = 0 ; i<keys.length ; i++){
//Phase.create({
//Name : data.phases[keys[i]].name,
//Duration : data.phases[keys[i]].time,	
//CanMove : data.phases[keys[i]].canMove,
//CanOffer :   data.phases[keys[i]].canOffer,
//CanTransfer :  data.phases[keys[i]].canTransfer
//}).complete(function(err,phase) {

//Phase_sequence.create({
//order_num : counter++
//}).complete(function(err, seq) {
//if (!!err) {
//console.log(err)
//}else{
//seq.setPhase(phase)
//seq.setConfiguration(conf)

////console.log(conf)
//}})})}}}))

//chainer.add(Board.create({
//Name: data.Board.Name,
//Number_of_rows: data.Board.Size.Cols,
//Number_of_cols: data.Board.Size.Rows
//}).complete(function(err, board) {
//if (!!err) {
//console.log(err)
//}
//for(var i = 0; i < data.Board.Size.Cols; i++) {
//for(var j = 0; j < data.Board.Size.Rows; j++) {
//var loc = data.Blocks[j];
//chainer.add(Block.create({
//Row : j,
//Col : i,
//Color : loc[i],
////BoardId : Board.find(1)
//}).complete(function(err, block) {
//if (!!err) {
//console.log(err)
//}else{
//block.setBoard(board).complete(function(err) {
////console.log(err)
//})
//}

//})
//)}
//}
//}))

//chainer.runSerially().success(function(){
//console.log('chainer done!');
//}).error(function(errors){
//console.log('chainer error!');
//})}


//)},

//createNewGame : function(configurationName){
//Game.create({
//GameId: Game.getCurrentId(),	
////ConfigurationId : configurationName,
//Num_of_players : 0
//}).complete(function(err, game){
//if (!!err){
//console.log('create new game failed');
//} else {
//game.setConfiguration(Configuration.find(configurationName))
//return 
//}
//})

//},

//joinPlayer : function(){
//Player.getId(function(id){
//Player.create({
//PlayerID : id+1,	
//Score : 0
//})
//})			
//}



//};