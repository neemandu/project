var confID = [];
var agx = require('./agxgame');
var validator = require('./Validator');
var AgentHelper = require('./AgentHelper');

var noType = 313+ ' - no \'Type\' attribute';
var illegalType = 314+ ' - illegal \'Type\' attribute';
var OK = 200;

exports.initGame = function(socket, data){
	var del = "\r\n";
	var res = "";
	console.log('tester Server!!!!!');
	try{
		var conf = JSON.parse(data);
	}
	catch(e){
	return "Bad conf file. "+e+del;
	}
	console.log('configuration file received');
	if(conf.Type === undefined){
		return noType;
	}
	
	switch(conf.Type){
		case "createConfig" :
			res = createConfig(conf);
			break;
		case "runConfig" :
			res = runConfig(conf);
			break;
		case "Agent" :
			res = doAction(socket, conf);
			break;
		default :
			res = illegalType;//illegal "Type" value.
	}
	return res+del;
}

createConfig = function(conf){

	console.log('createConfig');
	

	var status = validator.validateConf(conf);
	agx.ConfigurtionToDataBase(conf);
	confID[conf.Global.ID] = conf;
	return status;

}

runConfig = function(conf){
	console.log('runConfig');
	var status = 200;
//	var co = confID[conf.Global.ID];
	//@TODO
//	if(co === undefined){
//		return 500;
//	}
	status = validator.validateRun(conf);
	//if(status === 200){
//		agx.runConfig(conf.confsToRun, co);
	//}
//	return status;

	console.log('status: '+status);
	if(status === OK){
		console.log('status is OK!!!');
		if(conf.confsToRun.length > 0){
			agx.runConfigurtion(conf.confsToRun, 0);
		}
	}
	return status;
}
doAction = function(socket, conf){
console.log('validating agent...');
	var status = 200;
	var co = validator.agent(conf);
	console.log(co);
	//@TODO
	if(co === 200){
		console.log('agent validation is fine!');
		status = AgentHelper.doAction(socket, conf);
		return status;
	}
	else{
		return co;
	}
}
exports.getConf = function(id){
	var co = confID[id];
	//@TODO
	if(co === undefined){
		return 500;
	}
	return co;
}
