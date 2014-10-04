/**
 * SETUP
 **/
var app = app || {};

/**
 * MODELS
 **/
app.SearchRslt = Backbone.Model.extend({  
    //url: function(){return 'http://localhost:3000/1/article/tag/'+this.attributes.tag},
    url: function(){return 'http://localhost:3000/1/article/tag/'+this.tag},
    tag: "",
    defaults: {
        success: false,
        errors: [],
        errfor: {},
        articles: [
        {
            "_id": "",
            "subject": "No matched articles.",
            "_author": "",
            "createTiming": ""
        }]
    }
});

/**
 * VIEWS
 **/
app.SearchView = Backbone.View.extend({
    //MVVM
    el: '#search-section',
    events: {
        'click #btn-search':'search'
    },
    initialize: function() {
        console.log("search initialize");
        this.model = new app.SearchRslt();
        this.template = _.template($('#tmpl-results').html());
        this.model.bind('change', this.render, this);//status change
        //this.model.fetch();
    },
    render: function() {
        var data = this.template(this.model.attributes);
        $("#searchRslt-section").html(data);
        return this;
    },
    search: function() {
        var tag = this.$el.find('#search_tag').val();
        console.log("searching for "+tag);
        this.model.tag = tag;
        //this.model.set('tag',tag);
        this.model.fetch();
    }
});

/**
 * MODELS
 **/
app.Post = Backbone.Model.extend({  
    //url: 'http://localhost:3000/1/article',
    url: function(){return 'http://localhost:3000/1/article'},
    defaults: {
        success: false,
        errors: [],
        errfor: {},
        subject: "",
        content: ""
    }
});

 /**
 * VIEWS
 **/
app.PostView = Backbone.View.extend({
    el: '#post-section',
    events: {
        'submit form': 'preventSubmit',
        'click #btn-post-submit': 'post'
    },
    initialize: function() {
        this.model = new app.Post();
        this.template = _.template($('#tmpl-post').html());
        this.model.bind('change', this.render, this);
        this.render();
    },
    render: function() {
        var data = this.template(this.model.attributes);
        this.$el.html(data);
        return this;
    },
    preventSubmit: function(event) {
        event.preventDefault();
    },
    post: function() {
        var subject = this.$el.find('#subject').val();
        var content = this.$el.find('#content').val();
        this.model.save({
            subject: subject,
            content: content
        });
    }
});

/**
 * MODELS
 **/
app.Article = Backbone.Model.extend({  
  //url: 'http://localhost:3000/1/article',
    url: function(){return 'http://localhost:3000/1/article'+this.query},
    query: "",
    defaults: {
        success: false,
        errors: [],
        errfor: {},
	      articles: [
        {
	          "content": "",
      	    "_id": "",
	          "subject": "No articles",
            "_author": "",
            "createTiming": ""
    	  }]
    }
});

/**
 * VIEWS
 **/
app.ArticleView = Backbone.View.extend({
	  el: '#article-section',
    events: {
        'click .btn-sort':'sort',//space between click and . is mandatory.
        'click .btn-format':'formatDate'
    },
    initialize: function() {
        this.model = new app.Article();
        this.template = _.template($('#tmpl-article').html());
        this.model.bind('change', this.render, this);
        this.model.fetch();
    },
    render: function() {
        var data = this.template(this.model.attributes);
        this.$el.html(data);
        this.formatDate();
        return this;
    },
    sort: function() {
        //var tag = this.$el.find('#search_tag').val();
        //alert('ok');
        //this.model.set('tag', tag);
        this.model.query = '?sort=date';
        this.model.fetch();
    },
    formatDate: function(){
        //console.log("formatDate");
        this.$el.find('.post-date').each(function () {
            var me = $(this);
            //console.log("me.text()="+me.text());
            //var fromNow = moment( me.text() ).startOf('day').fromNow();
            me.html( moment( me.text() ).startOf('day').fromNow() );
        });
    }
});

/**
 * BOOTUP
 **/
$(document).ready(function() {
    app.articleView = new app.ArticleView();
    app.searchView = new app.SearchView();
    app.postView = new app.PostView();
});