/**
 * SETUP
 **/
  var app = app || {};

/**
 * MODELS
 **/
app.SearchedSubject = Backbone.Model.extend({  
  url: function(){return 'http://localhost:3000/1/article/author/'+this.attributes.name},
  name: "",
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

app.Article = Backbone.Model.extend({  
  url: 'http://localhost:3000/1/article',
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
  app.SearchView = Backbone.View.extend({
    //MVVM
    el: '#search-section',
    events: {
      'click .btn-search':'search'
    },
    initialize: function() {
        this.model = new app.SearchedSubject();
        this.template = _.template($('#tmpl-results').html());
        this.model.bind('change', this.render, this);//status change
        //this.model.fetch();
    },
    render: function() {
        var data = this.template(this.model.attributes);
        this.$el.html(data);
        return this;
    },
    search: function() {
      var name = this.$el.find('#search_tag').val();
      //alert('ok');
      this.model.set('name', name);
      this.model.fetch();
    }
  });

  app.PostView = Backbone.View.extend({
  	el: '#blog-post',
    events: {
    },
    initialize: function() {
        this.model = new app.Article();
        this.template = _.template($('#tmpl-post').html());
        this.model.bind('change', this.render, this);
        this.model.fetch();
    },
    render: function() {
        var data = this.template(this.model.attributes);
        this.$el.html(data);
        return this;
    }
  });

/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.postView = new app.PostView();
    app.searchView = new app.SearchView();
  });