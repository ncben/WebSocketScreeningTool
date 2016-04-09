var screeningRouter = Backbone.Router.extend({

    routes: {
		""		: "ListAllHeats",
		"GetHeat/(:HeatId)"		: "GetHeat",
        "login/:next" : "loginRedirect",
		"403(/:next)" : "403"
    },

    initialize: function () {
				
        this.headerView = new HeaderView();
        $('.header').eq(0).html(this.headerView.el);
						
		//Initialize auth
		window.loginView = new LoginView();
		
        $(function(){
			$.ajaxSetup({
				statusCode: {
					401: function(){
						app.navigate('login/'+encodeURIComponent('/'+window.location.hash), {trigger: true, replace: true});
					},
					403: function() {
						app.navigate('403/'+encodeURIComponent('/'+window.location.hash), {trigger: true, replace: true});
						
					}
					
				}
			});
			$('body').append(loginView.render().el);
			
		})
		
    },
	
	403: function(next) {
	
		$("#loginModal").modal();
		$("#loginModal .alert-info").show();
		$("#loginModal .alert-danger").hide();
		$("#loginModal .alert-warning").hide();
		window.nextNoTrigger = next;

    },

	loginRedirect: function(next) {
	
		$("#loginModal").modal();
		$("#loginModal .alert-info").hide();
		$("#loginModal .alert-danger").hide();
		$("#loginModal .alert-warning").show();
		window.nextTrigger = next;

    },
	
	login: function() {
	
		$("#loginModal").modal();
		$("#loginModal .alert-info").hide();
		$("#loginModal .alert-danger").hide();
		$("#loginModal .alert-warning").hide();
		window.nextTrigger = '/';

    },
	
	GetHeat: function(HeatId){
		
		var laysCollection = new screeningCollection({path: '/GetHeat'});
		
		laysCollection.fetch({ data: $.param({'HeatId': HeatId})}).success(function(){
		
			$("#content").html(new GetHeatView({model: laysCollection, collection: laysCollection}).el);

			
		})
		
	},
	
	
	ListAllHeats: function () {
				
		var laysCollection = new screeningCollection();
		
		laysCollection.fetch({ data: $.param({})}).success(function(){
		
			$("#content").html(new ScreeningView({model: laysCollection, collection: laysCollection}).el);

			
			
		})
			
    },
	

});

utils.loadTemplate(['LoginView', 'HeaderView','ScreeningView','ScreeningHeatsView', 'GetHeatView', 'GetHeatsEntryView'], function() {
    app = new screeningRouter();
    Backbone.history.start();

	
});



;(function($){	
	$.titleAlert = function(text, settings) {
		// check if it currently flashing something, if so reset it
		if ($.titleAlert._running)
			$.titleAlert.stop();
		
		// override default settings with specified settings
		$.titleAlert._settings = settings = $.extend( {}, $.titleAlert.defaults, settings);
		
		// if it's required that the window doesn't have focus, and it has, just return
		if (settings.requireBlur && $.titleAlert.hasFocus)
			return;
		
		// originalTitleInterval defaults to interval if not set
		settings.originalTitleInterval = settings.originalTitleInterval || settings.interval;
		
		$.titleAlert._running = true;
		$.titleAlert._initialText = document.title;
		document.title = text;
		var showingAlertTitle = true;
		var switchTitle = function() {
			// WTF! Sometimes Internet Explorer 6 calls the interval function an extra time!
			if (!$.titleAlert._running)
				return;
			
		    showingAlertTitle = !showingAlertTitle;
		    document.title = (showingAlertTitle ? text : $.titleAlert._initialText);
		    $.titleAlert._intervalToken = setTimeout(switchTitle, (showingAlertTitle ? settings.interval : settings.originalTitleInterval));
		}
		$.titleAlert._intervalToken = setTimeout(switchTitle, settings.interval);
		
		if (settings.stopOnMouseMove) {
			$(document).mousemove(function(event) {
				$(this).unbind(event);
				$.titleAlert.stop();
			});
		}
		
		// check if a duration is specified
		if (settings.duration > 0) {
			$.titleAlert._timeoutToken = setTimeout(function() {
				$.titleAlert.stop();
			}, settings.duration);
		}
	};
	
	// default settings
	$.titleAlert.defaults = {
		interval: 500,
		originalTitleInterval: null,
		duration:0,
		stopOnFocus: true,
		requireBlur: false,
		stopOnMouseMove: false
	};
	
	// stop current title flash
	$.titleAlert.stop = function() {
		clearTimeout($.titleAlert._intervalToken);
		clearTimeout($.titleAlert._timeoutToken);
		document.title = $.titleAlert._initialText;
		
		$.titleAlert._timeoutToken = null;
		$.titleAlert._intervalToken = null;
		$.titleAlert._initialText = null;
		$.titleAlert._running = false;
		$.titleAlert._settings = null;
	}
	
	$.titleAlert.hasFocus = true;
	$.titleAlert._running = false;
	$.titleAlert._intervalToken = null;
	$.titleAlert._timeoutToken = null;
	$.titleAlert._initialText = null;
	$.titleAlert._settings = null;
	
	
	$.titleAlert._focus = function () {
		$.titleAlert.hasFocus = true;
		
		if ($.titleAlert._running && $.titleAlert._settings.stopOnFocus) {
			var initialText = $.titleAlert._initialText;
			$.titleAlert.stop();
			
			// ugly hack because of a bug in Chrome which causes a change of document.title immediately after tab switch
			// to have no effect on the browser title
			setTimeout(function() {
				if ($.titleAlert._running)
					return;
				document.title = ".";
				document.title = initialText;
			}, 1000);
		}
	};
	$.titleAlert._blur = function () {
		$.titleAlert.hasFocus = false;
	};
	
	// bind focus and blur event handlers
	$(window).bind("focus", $.titleAlert._focus);
	$(window).bind("blur", $.titleAlert._blur);
})(jQuery);
