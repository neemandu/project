var confID = [];

var agx = require('./agxgame');
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
	
	if(conf.Global.what_to_do === "createConfig"){
		res = createConfig(conf);
	}
	else if(conf.Global.what_to_do === "runConfig"){
		res = runConfig(conf);
	}
//console.log(conf.Goal.x);
	return res+del;
}

createConfig = function(conf){
	var status = "200";
	confID[conf.Global.ID] = conf;
	
	//@TODO insert conf into DB, where conf id and writer are the key.
	
	return status;
}

runConfig = function(conf){
	var status = "200";
	var co = confID[conf.Global.ID];
	//@TODO
	if(co === undefined){
		return 500;
	}
	agx.runConfig(co);
	return status;
}