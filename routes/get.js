module.exports = function(app, express, io, connection){
	
	var _ = require('underscore');
	
	io.set('log level', 1);
	
	var usernames = {};

	io.on('connection', function(socket){ 
			
		if(!socket.handshake.headers.cookie || !require('cookie').parse(socket.handshake.headers.cookie).user){
				
			socket.emit('error', {error:'No cookies detected. Refresh this page to check for new entry.'});
			
		}	
		
		
		socket.on('connect', function (data) {
			if(require('cookie').parse(socket.handshake.headers.cookie).user){
			
				socket.username = require('cookie').parse(socket.handshake.headers.cookie).user;
				
				
			}
		});
		
		socket.on('join_heat', function (data) {
					
			socket.heat = data.week+'.'+data.heat;
							
			if(typeof usernames[socket.heat] == 'undefined')usernames[socket.heat] = {};
			
			socket.username = require('cookie').parse(socket.handshake.headers.cookie).user;
			
			usernames[socket.heat][socket.id] = {user: require('cookie').parse(socket.handshake.headers.cookie).user, name: require('cookie').parse(socket.handshake.headers.cookie).name};

			socket.broadcast.to(socket.heat).emit('user_online',{usernames: usernames[socket.heat]});
			
			socket.emit('user_online', {usernames: usernames[socket.heat]});
			
		})
		
		socket.on('leave', function(data){
						
			socket.leave(socket.heat);
			
			if(typeof usernames[socket.heat] != 'undefined' && typeof usernames[socket.heat][socket.id] != 'undefined'){
				
				delete usernames[socket.heat][socket.id];
				socket.broadcast.to(socket.heat).emit('user_online',{usernames: usernames[socket.heat]});
				
			}
			
		})
		
		socket.on('get_entry', function(data){
												
			socket.heat = data.week+'.'+data.heat;
			socket.join(socket.heat);
						
			var query = connection.query('SELECT CAST(`tweet_id` AS CHAR(20)) as tweet_id, ?? FROM ?? WHERE `tweet_id` NOT IN (SELECT `tweet_id` FROM `screening_results`) ORDER BY `created_at_et` ASC, `tweet_id` ASC LIMIT 1', [['text', 'media_url_https', 'urls', 'user_screen_name'], 'vw_twitter_entries_week_'+socket.heat.split('.')[0]+'_heat_'+socket.heat.split('.')[1]]), entries = [];
			 
			query
			.on('error', function(err) {

				console.log( err );
				socket.emit('error', {error:err});
				
			})
			.on('result', function( entry ) {

				entries.push( entry );
			})
			.on('end',function(){
								
				connection.query('SELECT count(1) AS total, `handle` FROM `screening_results` WHERE screening_results.`wk` = ? AND screening_results.handle = ? AND `screening_results`.approved = 1', [socket.heat.split('.')[0],  entries[0] && entries[0].user_screen_name ? entries[0].user_screen_name : 'undefined!!'], function(err, dup_results){

					if(err){
						console.log(err);
						socket.emit('error', {error: err});
						return;	
					}
											
					if(dup_results[0] && dup_results[0].total > 0 && dup_results[0].handle && entries[0].tweet_id){

						connection.query('INSERT IGNORE INTO `screening_results` SET ?', {tweet_id: entries[0].tweet_id, screened_by: 'auto_disapprove@reason_duplicate.in_same_week', approved: -1, ts: new Date(), heat: socket.heat.split('.')[1], wk: socket.heat.split('.')[0], handle: dup_results[0].handle }, function(err, results){
							
							if(err){
								console.log(err);
								socket.emit('error', {error: err});
								return;	
							}
							
							socket.emit('new_entry',{entry: undefined, week: socket.heat.split('.')[0], heat: socket.heat.split('.')[1]});						
							
						})
						
						return;
						
					}else{
					
						
						connection.query('SELECT count(1) AS total, tbl_week_heat.prize_amount FROM `screening_results`, tbl_week_heat WHERE screening_results.`heat` = ? AND screening_results.`wk` = ? AND screening_results.heat = tbl_week_heat.heat AND screening_results.wk = tbl_week_heat.`week` AND `screening_results`.approved = 1', [socket.heat.split('.')[1], socket.heat.split('.')[0]], function(err, results){
							
							if(err){
								console.log(err);
								socket.emit('error', {error: err});
								return;	
							}
							
							results = results[0];
							
							if(parseInt(results.total) >= parseInt(results.prize_amount)){
							
								socket.emit('screening_complete', {total: results.total, prize_amount: results.prize_amount, week: socket.heat.split('.')[0], heat: socket.heat.split('.')[1]});
								socket.broadcast.to(socket.heat).emit('screening_complete', {total: results.total, prize_amount: results.prize_amount, week: socket.heat.split('.')[0], heat: socket.heat.split('.')[1]});
								
							}else{
								
								socket.emit('new_entry',{entry: entries[0], week: socket.heat.split('.')[0], heat: socket.heat.split('.')[1]});						
							}
							
							socket.emit('user_online', {usernames: usernames[socket.heat]});
						})
						
					}
		
							
				});	
			
				
			})
			
		
		});
		
		socket.on('screen', function(data){
			
			if(!socket.heat){
				
				console.log('Socket Heat Not Defined');
			
				socket.emit('error', {error: 'Please refresh this page and try the request again. If you continue to get this error message, try using the latest version of a HTML5 compatible browser such as Google Chrome or Firefox.'});
				return;
				
			}
						
			if(data.id && data.handle){
				
				connection.query('INSERT IGNORE INTO `screening_results` SET ?', {tweet_id: data.id, screened_by: socket.username, approved: data.approve == 1 ? 1 : -1, ts: new Date(), heat: socket.heat.split('.')[1], wk: socket.heat.split('.')[0], handle: data.handle }, function(err, results){
					
					if(err)return socket.emit('error', {error: err});
					
					socket.broadcast.to(socket.heat).emit('screened',{id: data.id});
					socket.emit('screen_success',{id: data.id});
					
					connection.query('SELECT count(1) AS total, tbl_week_heat.prize_amount FROM `screening_results`, tbl_week_heat WHERE screening_results.`heat` = ? AND screening_results.`wk` = ? AND screening_results.heat = tbl_week_heat.heat AND screening_results.wk = tbl_week_heat.`week` AND `screening_results`.approved = 1', [socket.heat.split('.')[1], socket.heat.split('.')[0]], function(err, results){
						
						
						results = results[0];
					
						if(parseInt(results.total) >= parseInt(results.prize_amount)){
							
							connection.query('SELECT `created_at_et` FROM ?? WHERE `tweet_id` = ?', ['vw_twitter_entries_week_'+socket.heat.split('.')[0]+'_heat_'+socket.heat.split('.')[1], data.id], function(err, ts){
								
								if(err){
									console.log(err);	
								}
							
								var nodemailer = require("nodemailer");
	
								// create reusable transport method (opens pool of SMTP connections)
								var smtpTransport = nodemailer.createTransport("SMTP",{
									host: "xxx.com", // hostname
									secureConnection: true, // use SSL
									port: 465, // port for secure SMTP
									auth: {
										user: "",
										pass: ""
									}
								});
	
								var mailOptions = {
									from: "Lays Screening Tool <test@test.com>", // sender address
									to: "test@test.com", // list of receivers
									subject: "All "+results.prize_amount+ " Prizes Taken for Week "+socket.heat.split('.')[0] + ', Heat '+socket.heat.split('.')[1], // Subject line
									text: "All prizes for this week/heat have been taken. Please tweet that there are no prizes left.", // plaintext body
									html: "<b>All prizes for this week/heat have been taken. Please tweet that there are no prizes left.</b><br><br>Prizes taken: "+results.total+"<br><br>Last Qualifying Timestamp: "+new Date(ts[0].created_at_et).toString() // html body
								};
								
								smtpTransport.sendMail(mailOptions, function(error, response){
									
									if(error){
										console.log(error);
									}else{
										console.log("Message sent: " + response.message);
									}
								
									smtpTransport.close();
									
								});
								
							})
							
						}
						
						
					})
					
					
				})

				
			}
			
		
		});
		
		socket.on('disconnect', function () {
			
			if(typeof usernames[socket.heat] == 'object'  && usernames[socket.heat][socket.id]){
				delete usernames[socket.heat][socket.id];
			}
			if(typeof usernames[socket.heat] == 'object'){

				socket.broadcast.to(socket.heat).emit('user_online',{usernames: usernames[socket.heat]});
			}
			socket.leave(socket.heat);
		});
		
		
	});
	
	app.get('/logout', function(req, res, next){
	
	
		res.clearCookie('user');
		res.clearCookie('name');
		req.session.destroy(function(){
			res.redirect('/');
		});	
		
	});
	
	app.get('/auth',  function(req, res){
	
		req.session.destroy(function(){
			res.json(200, { loggedOut: true });
		});
	});
	
	app.get('/me', function(req, res){
		
		if(req.session.user){
			res.json({ username: req.session.user, name: req.session.firstname });
		}else{
			res.writeHead(400);
			res.end(); 
			return;	
		}
	
	});
	
	app.get('/lays/api', authCheck, function(req, res){
		
		var query = connection.query('SELECT IF(screening_results.pkey IS NULL, 0, count(1)) as total, tbl_week_heat.* FROM `tbl_week_heat`  LEFT JOIN screening_results ON tbl_week_heat.`week` = screening_results.wk AND tbl_week_heat.heat =  screening_results.heat  AND `screening_results`.approved = 1 GROUP BY tbl_week_heat.`week`, tbl_week_heat.`heat` ORDER BY  tbl_week_heat.`week` ASC,  tbl_week_heat.`heat` ASC'), heats = [];
		 
		query
		.on('error', function(err) {

			console.log( err );
			res.json(500, {error: err})
			
		})
		.on('result', function( heat ) {

			heats.push( heat );
		})
		.on('end',function(){
		
			res.json(200, {Heats:heats});
				
		});		
		
		
	})
	
	app.get('/lays/api/GetHeat', authCheck, function(req, res){
		
		if(!req.query.HeatId || !req.query.HeatId.split('.')[0] || !req.query.HeatId.split('.')[1]){
		
			res.send(400);	
			
		}
				 
		
		res.json(200, {heat:req.query.HeatId.split('.')[1], week: req.query.HeatId.split('.')[0]});
			
		
	})
	
}
