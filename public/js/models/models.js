window.screening = Backbone.Model.extend({

    urlRoot: "/lays/api",
    idAttribute: "path"
	
})


window.screeningCollection = Backbone.Collection.extend({

    model: screening,
    url: function(){
		
		var urlFragment = (typeof this.pluck('path')[0] != 'undefined') ? this.pluck('path')[0] : '';
        return "/lays/api" + urlFragment;
	},
    idAttribute: "path"
	
})