var net = require('net');
var testerIO = net.createServer(function (c)
{ //'connection' listener
	console.log('Java client connected to this nodeServer');
    c.on('data', function (data)
    {
		var conf = JSON.parse(data);
    	console.log(conf);
    //	c.write(res);
    //	c.pipe(c);
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