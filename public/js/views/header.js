window.HeaderView = Backbone.View.extend({

    initialize: function () {
        this.render();
    },

    render: function () {
        $(this.el).html(this.template());
        return this;
    },

    selectMenuItem: function (menuItem) {
        $('.header .nav li').removeClass('active');
        if (menuItem) {
            $('.header .' + menuItem).addClass('active');
        }
    }

});