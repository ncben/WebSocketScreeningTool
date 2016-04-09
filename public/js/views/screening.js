
window.ScreeningView = Backbone.View.extend({
	
    initialize: function () {
		this.render();
			
		
    },
	
	events: {
		
	
	},
	
    render: function () {
				
        $(this.el).html(this.template());
		
		$("#heatsListBody", this.el).append(new ScreeningHeatsView({model: this.model, collection: this.collection}).el);
		 				
		var el = this.$el;	
		
		if(window.socket)socket.emit('leave');
				 		
        return this;
    },

});


window.ScreeningHeatsView = Backbone.View.extend({

    initialize: function () {
		
        this.render();
    },
	
	tagName: "tbody",
		
    render: function () {
				
        $(this.el).html(this.template({Heats: this.collection.pluck('Heats')[0]}));
        return this;
    }

});



window.GetHeatView = Backbone.View.extend({
	
    initialize: function () {	
	
		if(typeof window.getEntryTimeout != 'undefined')clearTimeout(window.getEntryTimeout);
		
		var socket = io.connect('https://laystwitterscreening.dja.com:8000');
				
		socket.removeAllListeners();
		
		window.socket = this.socket = socket;
		
		socket.on('connect', $.proxy(function(){

			socket.emit('join_heat', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
			
		},this));
				
		socket.on('new_entry', $.proxy(function (data) {
			
			$("#screenEntry").empty();
			$("#screenEntryAlreadyScreened, #screenEntryAwaitingNew, #socketError").hide();
			
			if(data && data.entry){
					
				$.titleAlert("(1) New Entry!", {
					requireBlur:false,
					stopOnFocus:false,
					stopOnMouseMove: true,
					duration:400000,
					interval:700
				});
							
				new Audio('/assets/ding.mp3').play();
				
				$("#screenEntry", this.el).append(new GetHeatsEntryView({model: this.model, collection: this.collection, entryData: data, socket: socket}).el);
			}else{
			
				$("#screenEntryAwaitingNew").show();
				
				window.getEntryTimeout = setTimeout($.proxy(function(){
					socket.emit('get_entry', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
				}, this), 2000);
					
				
			}
				
		},this));
		
		socket.on('user_online', $.proxy(function (data) {
						
			var uidObj = {};
									
			if(data.usernames){
				
				$("#usersInHeat ul").empty();
			
				for(var id in data.usernames){
				
					if(data.usernames.hasOwnProperty(id)){
						
						if(id && data.usernames[id] && data.usernames[id].name && !uidObj[data.usernames[id].user]){
							
							uidObj[data.usernames[id].user] = 1;
					
							$("#usersInHeat ul").append($("<li />").html(data.usernames[id].name));
							
						}
						
					}
					
				}
			}
						
		},this));
		
		socket.on('screen_success', $.proxy(function (data) {
			
			if(data.id == $(".dataCache").data('id')){
				$("#screenEntry").empty();
				$("#screenEntryAwaitingNew").show();

				socket.emit('get_entry', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
				
			}
						
		},this));
		
		socket.on('screened', $.proxy(function (data) {
						
			if(data.id == $(".dataCache").data('id')){
				$("#screenEntry").empty();
				$("#screenEntryAlreadyScreened").show();
				
				window.getEntryTimeout = setTimeout($.proxy(function(){
					socket.emit('get_entry', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
				}, this), 3000);
				
			}
						
		},this));
		
		socket.on('screening_complete', $.proxy(function (data) {
			
			if(data.heat == this.collection.pluck('heat')[0] && data.week   == this.collection.pluck('week')[0]){
									
				$("#screenEntry").empty();
				$("#screenEntryAlreadyScreened, #screenEntryAwaitingNew, #socketError").hide();
				$("#screenEntryAllScreened").show();
			}
									
		},this));
		
		
		socket.on('error', $.proxy(function (data) {
						
			$("#socketError").show();
			if(typeof data.error == 'object'){
				$("#socketError span").text('A database error occurred. Please refresh and try again.')	
			}else{
				$("#socketError span").text(data.error || 'An error occurred. Please refresh and try again.')	
			}
										
		},this));
		
		socket.emit('join_heat', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
		socket.emit('get_entry', {heat: this.collection.pluck('heat')[0], week: this.collection.pluck('week')[0]});
		
		this.render();
			
		
    },
	
	events: {
		
	
	},
	
    render: function () {
				
        $(this.el).html(this.template({heat: {week: this.collection.pluck('week')[0], heat:this.collection.pluck('heat')[0]}}));
		 				
		var el = this.$el;	
						 		
        return this;
    }
	
	
	

});


window.GetHeatsEntryView = Backbone.View.extend({

    initialize: function (options) {
					
		this.options = options || {};	
		
		this.render();
		
    },	
	
	events: {
		
		'click #approveEntry': 'approveEntry',
		'click #rejectEntry': 'rejectEntry',
		
	},
	
	approveEntry: function(event){
		
		event.preventDefault();
						
		this.options.socket.emit('screen', {reject: 0, approve: 1, id: $(".dataCache").data('id'), handle: $(".dataCache").data('handle')})
		
	},
	
	rejectEntry: function(event){
		
		event.preventDefault();
		
		this.options.socket.emit('screen', {reject: 1, approve: 0, id: $(".dataCache").data('id'), handle: $(".dataCache").data('handle')})
		
	},
			
    render: function () {
						
        $(this.el).html(this.template({Entry: this.options.entryData.entry, Stat: {week: this.collection.pluck('week')[0], heat: this.collection.pluck('heat')[0]}}));
        return this;
    }

});


