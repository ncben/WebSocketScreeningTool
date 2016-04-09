module.exports = function(app, express, io, connection){
		
	app.post('/auth', function(req, res){
						
		var authenticate = function(username, pass, fn) {

			 connection.query('SELECT * FROM screening_users WHERE email = ? AND password = ?', [username,pass], function(err,user) {

				if(err)console.log(err);
								
				if(typeof user[0] != 'undefined')fn('', user[0]);
					else fn('Incorrect username/password.')
				 
			 })
			
			
		}

		authenticate(req.body.email, req.body.password, function(err, user){
			if (user) {
				
			
				req.session.regenerate(function(){
								  					
					req.session.user = user.email;
					req.session.firstname = user.name;	
					
					res.cookie('user',req.session.user, {domain: '.dja.com', path: '/', maxAge: 60000000, httpOnly: false, secure: false})
					res.cookie('name',req.session.firstname, {domain: '.dja.com', path: '/', maxAge: 60000000, httpOnly: false, secure: false})
					
					
					res.json({ name: user.name });	
				
				});
			} else {
						  
				req.session.destroy(function(){
					res.json(400, { id: '', error: err });
				})
			
			}
		})
	});
}