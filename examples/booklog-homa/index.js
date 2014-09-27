/**
 * Module dependencies.
 */

var express = require('../../lib/express');

// Path to our public directory

var pub = __dirname + '/public';

// setup middleware

var app = express();
app.use(express.static(pub));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/booklog2');

var dbConn = mongoose.connection;
dbConn.on('error', console.error.bind(console, 'connection error:'));
dbConn.once('open', function callback () {
  console.log('MongoDB: connected.'); 
});

//Table
var articleSchema = new mongoose.Schema({
    subject: { type: String, default: ''},
    content: { type: String },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
});

var memberSchema = new mongoose.Schema({
    id: {type: String, unique:true},
    name: {type: String},
    createTiming: {type: Date, default:Date.now},
    accountSrc: {type: String},
    fullInfo: {}
});

//put to express framework
//'Post'=Tablename
//Model is definition of document.
//new schema to a model, naming for the schema to a model named 'Post'.
//Collection name=&model_name+"s"(lower case), e.g. posts.
app.db = {
  articles: mongoose.model('Article', articleSchema),
  members: mongoose.model('Member', memberSchema)
};

// Optional since express defaults to CWD/views

app.set('views', __dirname + '/views');

// Set our default template engine to "jade"
// which prevents the need for extensions
// (although you can still mix and match)
app.set('view engine', 'jade');

/*
var posts = [{
  subject: "Hello",
  content: "Hi !"
}, {
  subject: "World",
  content: "Hi !"
}];*/

var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({ secret: 'abd333Sh21' }));
app.use(passport.initialize());//use is mean middleware...(?)
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
});

passport.use(new FacebookStrategy({
    clientID: "573894422722633",
    clientSecret: "cd295293760fb7fe56a69c1aae66da51",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    app.db.members.findOne({"fullInfo._json.id": profile.id},
    function(err, user) {
      if (!user) {
        var user = new app.db.members(
        {
           id: profile.id,
           name: profile.displayName,
           accountSrc: profile.provider,
           fullInfo: profile
        });
        user.save();//new a member.
      }
      return done(null, user);
    });
  }
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook',passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

app.all('*', function(req, res, next){
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

app.get('/', function(req, res, next) {
  //console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    next();
  } else {
    res.render('login');
  }
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/download', function(req, res) {
  var events = require('events');
  var workflow = new events.EventEmitter();

  workflow.outcome = {
    success: false,
  };

  workflow.on('vaidate', function() {
    var password = req.query.password;

    if (typeof(req.retries) === 'undefined')
      req.retries = 3;

    if (password === '123456') {
      return workflow.emit('success');
    }

    return workflow.emit('error');
  });

  workflow.on('success', function() {
    workflow.outcome.success = true;
    workflow.outcome.redirect = { 
      url: '/welcome'
    };
    workflow.emit('response');
  });

  workflow.on('error', function() {
    if (req.retries > 0) {
      req.retries--;
      workflow.outcome.retries = req.retries;
      workflow.emit('response');
    }

    workflow.outcome.success = false;
    workflow.emit('response');
  });

  workflow.on('response', function() {
    return res.send(workflow.outcome);
  });

  return workflow.emit('vaidate');
});

/*
app.get('/article', function(req, res) {
  res.render('post');
});*/

app.get('/1/article/:id', function(req, res) { 
  var id = req.params.id;
  //var model = req.app.db.posts;

  //Read
  //"_id:" is the attribute auto generated by mongodb, meanwhile it's represented the document name also.
  app.db.articles.findOne({_id: id}, function(err, data) {
    res.send({article: data}); 
  });
});

app.get('/1/article', function(req, res) { 
  //var model = req.app.db.articles;

  app.db.articles.find(function(err, data) {
    res.send({articles: data}); 
  });
});


app.post('/1/article', function(req, res) {
  //var model = req.app.db.posts;

  var subject;
  var content;

  if (typeof(req.body.subject) === 'undefined') {
    subject = req.query.subject;
    content = req.query.content;
  } else {
    subject = req.body.subject;
    content = req.body.content;   
  }

  /*
  var post = {
    subject: subject,
    content: content
  };*/

  //console.log(req.user);

  //posts.push(post);
  //Create
  var article = new app.db.articles(
  {
    subject: subject,
    content: content,
    authorId: req.user._id
  });//new a d"ocument by post object.
  article.save();
  res.send({ status: article.subject + " was posted."});
});

app.delete('/1/article/:id', function(req, res) {
  var id = req.params.id;
  res.send("Delete an article:" + id);
});

app.put('/1/article/:id', function(req, res) {
  var id = req.params.id;
  res.send("Update an article:" + id);
});

// change this to a better error handler in your code
// sending stacktrace to users in production is not good
app.use(function(err, req, res, next) {
  res.send(err.stack);
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
