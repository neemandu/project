var Sequelize = require('sequelize')
, sequelize = new Sequelize('colortrails', 'project', 'ColorTrails', {
	dialect: "mysql",
	port:    3306, 
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


var User = sequelize.define('users', {
	id :{type: Sequelize.INTEGER, primaryKey: true},
	score :{type: Sequelize.INTEGER},
})



var Block = sequelize.define('Blocks', {
	Row :{type: Sequelize.INTEGER, primaryKey: true},
	Col :{type: Sequelize.INTEGER, primaryKey: true},
	Color :  Sequelize.INTEGER,
	BoardId: { type: Sequelize.STRING , primaryKey: true}
})


var Board = sequelize.define('Boards', {
	Name: {type: Sequelize.STRING, primaryKey: true},
	Number_of_rows: Sequelize.INTEGER,
	Number_of_cols: Sequelize.INTEGER
}) 


Board.hasMany(Block);
Block.belongsTo(Board);

//Configuration = sequelize.define('Configuration', {
//	Name: {type: Sequelize.STRING, primaryKey: true},
//	Min_Players: Sequelize.INTEGER,
//	Num_Of_Players: Sequelize.INTEGER,
//	Number_of_Phase: Sequelize.INTEGER
//}) 
//
//var Phase = sequelize.define('Phase', {
//	Name : {type: Sequelize.STRING, primaryKey: true},
//	Duration : Sequelize.INTEGER,	
//	CanMove : Sequelize.BOOLEAN,
//	CanOffer :  Sequelize.BOOLEAN,
//	CanTransfer : Sequelize.BOOLEAN
//}) 
//
//
//var Phase_sequence = sequelize.define('Phase_sequence', {
//	order_num: Sequelize.INTEGER,	
//	ConfigurationId : {type: Sequelize.STRING},
//	PhaseId : { type: Sequelize.STRING}
//}) 
//
//
//Phase.hasMany(Phase_sequence);
//Phase_sequence.belongsTo(Phase);
//
//Configuration.hasMany(Phase_sequence);
//Phase_sequence.belongsTo(Configuration);
//
//var Game = sequelize.define('Game', {
//	GameId: {type: Sequelize.INTEGER, primaryKey: true},	
//	ConfigurationId : {type: Sequelize.STRING},
//}, {
//	classMethods: {
//
//
//		getId: function(callback){ 
//			sequelize.query("SELECT GameId FROM Game WHERE GameId = ( SELECT MAX(GameId) FROM Game ) ;")
//			.complete(function(err, ans) {
//				if (!!err) {
//					console.log(err)
//				} else {
//					//console.log(ans)
//					//console.log(ans[0].PlayerID+1)
//					callback(ans[0].PlayerID)
//				}
//			})
//		}
//	}}) 
//
//	Game.hasOne(Configuration)
//	Configuration.belongsTo(Game)
//
//
////	var Player = sequelize.define('Player', {
////	PlayerID : {type: Sequelize.INTEGER, primaryKey: true},	
////	Score : Sequelize.INTEGER
////	}) 
//
////	Player.hasMany(Game)
////	Game.hasMany(Player)
//
//
////	Player.hasMany(Block);
////	Block.belongsTo(Player);
//
//	var Player = sequelize.define('Player', {
//		PlayerID : {type: Sequelize.INTEGER, primaryKey: true, defaultValue : 0},	
//		GameId : {type: Sequelize.INTEGER, primaryKey: true},	
//		//Step_number :{type: Sequelize.INTEGER, primaryKey: true},
//		Score : Sequelize.INTEGER
//	}, {
//		classMethods: {
//
//			getId: function(callback){ 
//				sequelize.query("SELECT * FROM Players WHERE PlayerID = ( SELECT MAX(PlayerID) FROM Players ) ;")
//				.complete(function(err, ans) {
//					if (!!err) {
//						console.log(err)
//					} else {
//						//console.log(ans)
//						//console.log(ans[0].PlayerID+1)
//						callback(ans[0].PlayerID)
//					}
//				})
//
//			}
//		}
//	}) 
//
//	Player.hasOne(Block, {as: 'Block' ,foreignKey : 'BlockId'})
//	Block.belongsTo(Player)
//
//	Player.hasMany(Game)
//	Game.hasMany(Player)
//
//
//
//
//
//
	module.exports = {

	syncDatabase : function(){

		sequelize.sync({ force: true }).complete(function(err) {
			if (!!err) {
				console.log(err)
			} else {
				console.log('synced')
			}
		}).on('success', function() {

			var chainer = new Sequelize.Utils.QueryChainer
		})},
	
	addUser : function(userId){
		var user1 = User.build({
			  id: userId,
			  score: 0
			})
			 
			user1
			  .save()
			  .complete(function(err) {
			    if (!!err) {
			      console.log('The instance has not been saved:', err)
			    } else {
			      console.log('We have a persisted instance now')
			    }
			  })
		
	}
	
	}

			//var keys = Object.keys(data.phases)
			//console.log(keys);
			// console.log(data.phases[keys[0]].name);

			//var counter=1;
			
//			chainer.add(
//					User.create({GameId: 0}).complete(function(err, game) {
//						if (!!err) {
//							console.log(err)
//						} else {
//							console.log(Configuration.find("conf1"))
//							//game.setConfiguration()
//						}
//					}))
			
//			chainer.add(
//					Game.create({GameId: 0}).complete(function(err, game) {
//						if (!!err) {
//							console.log(err)
//						} else {
//							console.log(Configuration.find("conf1"))
//							//game.setConfiguration()
//						}
//					}))
//			
//			chainer.add(
//					Player.create({
//						Score : 0
//					}).complete(function(err, conf) {
//						if (!!err) {
//							console.log(err)
//						}
//					}))
//
//
//					chainer.add(
//							Configuration.create({
//								Name: data.Configuration.name,
//								Min_Players: data.Configuration.min_players ,
//								Max_Players: data.Configuration.max_players ,
//								Number_of_Phase: data.Configuration.num_of_phases
//							}).complete(function(err, conf) {
//								if (!!err) {
//									console.log(err)
//								} else {
//									for (var i = 0 ; i<keys.length ; i++){
//										Phase.create({
//											Name : data.phases[keys[i]].name,
//											Duration : data.phases[keys[i]].time,	
//											CanMove : data.phases[keys[i]].canMove,
//											CanOffer :   data.phases[keys[i]].canOffer,
//											CanTransfer :  data.phases[keys[i]].canTransfer
//										}).complete(function(err,phase) {
//
//											Phase_sequence.create({
//												order_num : counter++
//											}).complete(function(err, seq) {
//												if (!!err) {
//													console.log(err)
//												}else{
//													seq.setPhase(phase)
//													seq.setConfiguration(conf)
//
//													//console.log(conf)
//												}})})}}}))
//
//												chainer.add(Board.create({
//													Name: data.Board.Name,
//													Number_of_rows: data.Board.Size.Cols,
//													Number_of_cols: data.Board.Size.Rows
//												}).complete(function(err, board) {
//													if (!!err) {
//														console.log(err)
//													}
//													for(var i = 0; i < data.Board.Size.Cols; i++) {
//														for(var j = 0; j < data.Board.Size.Rows; j++) {
//															var loc = data.Blocks[j];
//															chainer.add(Block.create({
//																Row : j,
//																Col : i,
//																Color : loc[i],
//																//BoardId : Board.find(1)
//															}).complete(function(err, block) {
//																if (!!err) {
//																	console.log(err)
//																}else{
//																	block.setBoard(board).complete(function(err) {
//																		//console.log(err)
//																	})
//																}
//
//															})
//															)}
//													}
//												}))
//
//												chainer.runSerially().success(function(){
//													console.log('chainer done!');
//												}).error(function(errors){
//													console.log('chainer error!');
//												})}
//
//
//		)},
//
//		createNewGame : function(configurationName){
//			Game.create({
//				GameId: Game.getCurrentId(),	
//				//ConfigurationId : configurationName,
//				Num_of_players : 0
//			}).complete(function(err, game){
//				if (!!err){
//					console.log('create new game failed');
//				} else {
//					game.setConfiguration(Configuration.find(configurationName))
//					return 
//				}
//			})
//
//		},
//
//		joinPlayer : function(){
//			Player.getId(function(id){
//				Player.create({
//					PlayerID : id+1,	
//					Score : 0
//				})
//			})			
//		}
//
//
//
//};
