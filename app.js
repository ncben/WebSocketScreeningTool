
/**
 * Module dependencies.
 */

var express = require('express'),
	https = require('https'),
	fs = require('fs'),
	path = require('path'),
	engines = require('consolidate');
			
var memcachedStore = require('connect-memcached')(express);

sessionObj = new memcachedStore({
				hosts: [ '1.2.3.4:11211' ],
				prefix: 'sample'
			});

	
// Configurations
	
var app = express();
var fs = require('fs');
var mysql = require('mysql');

var sslOptions = {
  key: fs.readFileSync('cert/xxx.com.key'),
  cert: fs.readFileSync('cert/xxx.com.crt'),
  ca: [
  	fs.readFileSync('cert/ca.crt', 'utf8')
	]
};

app.enable('trust proxy');
app.disable('x-powered-by');
app.set('views', __dirname + '/views');
app.engine('html', engines.ejs);
app.set('view engine', 'ejs');
app.set('view options',{layout:false});
app.use(express.compress());
app.use(express.timeout(3000));
app.use(express.methodOverride());
app.use(express.logger('dev'));
app.use(express.json({limit: '250mb'}));
app.use(express.urlencoded({limit: '250mb'}));
app.use(express.cookieParser('xxx'));
app.use(express.session({
	key: 'sample',
	secret: 'xxx',
	cookie: {
		path: '/',
		httpOnly : true,
		secure: false,  
		maxAge  : new Date(Date.now() + 3600000)
	},
	store: sessionObj
}));
	
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

var server  = https.createServer(sslOptions, app);

var io = require('socket.io').listen(server);

var connection;

function handleConnection() {
	
     connection          = mysql.createConnection({
        host        : '1.2.3.4',
        user        : 'user',
        password    : '1234',
        database    : 'DBNAME',
        port        : 3306
    });

	connection.connect(function(err) {            
		if(err) {                                 
			console.log('error when connecting to db:', err);
			setTimeout(handleConnection, 2000); 
		}else{
			
			connection.query('SET session wait_timeout=1200');
			console.log('mysql connected');
			
		}
	});                                     
										 
	connection.on('error', function(err) {
		
		console.log('db error', err);
        if (err instanceof Error) {
			if(err.code === 'PROTOCOL_CONNECTION_LOST') {
                
				console.error(err.stack);
                console.log("Lost connection. Reconnecting...");

				handleConnection(); 
				var touch = require("touch")
				touch('app.js');          
							
			} else {         
			
				console.log(err);
				connection.end();
				setTimeout(handleConnection, 2000);
				var touch = require("touch")
				touch('app.js'); 
	
			}
		}
	});
}

handleConnection();

server.listen(8000);


// Routes

app.use(express.static(path.join(__dirname, 'public') /* , { maxAge: 31557600000 } */));

require('./routes/login')(app, express, io, connection);

authCheck = function(req, res, next) {

	if(!req.session.user){
		
		var touch = require("touch")
		touch('app.js');    
		res.send(401);
		
	}
	
		else{
			
			res.cookie('user',req.session.user, {domain: '.xxx.com', path: '/', maxAge: 60000000, httpOnly: false, secure: false})
			res.cookie('name',req.session.firstname, {domain: '.xxx.com', path: '/', maxAge: 60000000, httpOnly: false, secure: false})
					
			next();
			
		}
	
};

require('./routes/get')(app, express, io, connection);

app.use(function(err,req, res, next){
	
	//500 Route
	console.log('500 error');
	console.log(err);
	res.status(500);
	var touch = require("touch")
	touch('app.js');
		
});

//Global Error Logging

process.on('uncaughtException', function(err) {
	
	console.error((new Date()).toUTCString() + " uncaughtException: " + err.message);
	console.error(err.stack);
	
	
});

process.on('ReferenceError', function(err){
	console.log('ReferenceError exception: ' + err);
})

process.on('exit', function() {
	console.log('About to exit.');
});


