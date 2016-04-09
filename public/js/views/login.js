
window.LoginModel = Backbone.Model.extend({
    
	urlRoot: '/auth'

});

window.LoginCollection = Backbone.Collection.extend({

    model: LoginModel,

    url: "/me"

});

window.LoginView = Backbone.View.extend({

    initialize: function () {
				
		var user = new LoginCollection();
		user.fetch({success: function(model, response){
			
			if(response.name){
				$(".navbar .user-menu").show();
				if(response.isManager === true)$(".navbar .manage-menu").show();
				$(".navbar .user-menu .user-menu-name").text(response.name);
				$(".loginBttn").hide();
			}
		
		}})
		
    },

    events: {
        "submit form": "login",
		"click .alert .close" : function(event){ $(event.target).parents('.alert').hide();}
    },

    render: function () {
        $(this.el).html(this.template());
        return this;
    },

    login: function (event) {
		
        event.preventDefault();
		
		var auth = new LoginModel();
		
		var view = this;
		
		var handlerSuccess = function(model, response){
			
			$("#loginModal").modal('hide');
			$('#password').empty();
			
			$("#loginSuccess").remove();
			
			$("#password").empty();
			
			$(".navbar .user-menu").show();
			if(response.isManager === true)$(".navbar .manage-menu").show();
			$(".navbar .user-menu .user-menu-name").text(response.name);
			$(".loginBttn").hide();
			
			if(window['nextTrigger']){
				app.navigate(window['nextTrigger'].substring(2), {trigger: true});
				window['nextTrigger'] = '';
			}else if(window['nextNoTrigger']){
				app.navigate(window['nextNoTrigger'].substring(2));
				window['nextNoTrigger'] = '';
			}
		
		}
		
		var handlerFail = function(model, response){
			
			$("#loginModal .alert-warning").hide();
			$("#loginModal .alert-danger").show();

		
		}
		
	
		auth.save( {
			email: $('#username').val(),
            password: $('#password').val()
		}, {success :handlerSuccess, error: handlerFail});

		
		
    }
});