/**
 * Module dependencies.
 */

var express = require('../../lib/express');

// Path to our public directory

var pub = __dirname + '/public';

// setup middleware

var app = express();
app.use(express.static(pub));

var events = require('events');
var _ = require('underscore');
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
    createTiming: {type: Date, default:Date.now},
    _author: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
});

/*
var textSearch = require('mongoose-text-search');
articleSchema.plugin(textSearch);
articleSchema.index({ content: 'text' });*/

articleSchema.index({ content:'text', subject:"text"});

var memberSchema = new mongoose.Schema({
    id: {type: String, unique:true},
    name: {type: String},
    createTiming: {type: Date, default:Date.now},
    accountSrc: {type: String},
    fullInfo: {}
});

var orderSchema = new mongoose.Schema({
    _buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    _article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    payService:{type: String},
    paymentInfo:{}
});

//put to express framework
//'Post'=Tablename
//Model is definition of document.
//new schema to a model, naming for the schema to a model named 'Post'.
//Collection name=&model_name+"s"(lower case), e.g. posts.
app.db = {
  articles: mongoose.model('Article', articleSchema),
  members: mongoose.model('Member', memberSchema),
  orders: mongoose.model('Order', orderSchema)
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
var jsonParser = bodyParser.json();
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
    callbackURL: "http://homatw.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    app.db.members.findOne({"fullInfo._json.id": profile.id},
    function(err, user) {
      if (!user) {//判斷是否為return user
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

var paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  //'host': 'api.sandbox.paypal.com',
  //'port': '',
  'client_id': 'AVCoixDvPUw5s42Fvw0A8g5BX-fTVCanS5mAeYOMhs3UYIoKp2PWPS2zvg7n',
  'client_secret': 'EOdRBBAhkcQ3cYWBfyITuhRhBDYQ9otkhnUM_ijkRhsBqMrSfakp7HtobcYE'
});

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
  //res.send("login ok.");
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
  //var events = require('events');
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
  app.db.articles.findOne({_id: id}, function(err, article) {
    res.send({article: article}); 
  });
});

/*
app.get('/1/article/author/:name', function(req, res) { 
  var name = req.params.name;
  var authorId;
  console.log("search author name="+name);

  app.db.members.findOne({name: name}, function(err, author) {
    console.log("author="+author);
    if (author){
        console.log("author id="+author._id);
        app.db.articles
        .find({_author:author._id})
        .populate('_author')
        .exec(function(err, articles) {
          console.log(articles);
          for (seq in articles){
              console.log("seq="+seq);
              console.log("article="+articles[seq]);
              console.log("subject="+articles[seq].subject);
              console.log("content="+articles[seq].content);
              console.log("_author="+articles[seq]._author);
              console.log("name="+articles[seq]._author.name);
          }
          res.send({articles: articles}); 
        });
    }else{
      //res.send({articles: []});
      //res.send({articles: null});
      res.send(null);
    }
    //authorId = author.id;
    //console.log("author id="+authorId);
  });
  console.log("searching...");
});*/

app.get('/1/article/tag/:tag', function(req, res) { 
  var tag = req.params.tag;
  app.db.articles
  .find({$text:{$search:tag}})
  .populate('_author')
  .exec(function(err, articles) {
    console.log(articles)
    for (seq in articles){
      console.log("seq="+seq);
      console.log("article="+articles[seq]);
      console.log("subject="+articles[seq].subject);
      console.log("content="+articles[seq].content);
      console.log("_author="+articles[seq]._author);
      console.log("name="+articles[seq]._author.name);
    }
    res.send({articles: articles}); 
  });

  /*
  app.db.articles.textSearch(keyword, function(err, output){
    res.send({articles: articles.}); 
  });*/
});

app.get('/1/article', function(req, res) { 
  var userId = req.user._id;
  var sort = req.query.sort; // ?sort=date
  var options = {sort: 'createTiming'};// Default options

  if (sort === 'date') {
    options.sort = '-createTiming';
  }

  app.db.articles
  .find()
  .populate('_author')
  .sort(options.sort)
  .lean()
  .exec(function(err, articles) {
    var maxCnt = articles.length;
    var counter = 0;
    _.each(articles, function(article){
      app.db.orders.findOne({$and:[{_buyer:userId}, {_article:article._id}]},
      function(err, order) {
          article.myOrder = order;
          if (++counter===maxCnt)
            return res.send({articles:articles});
      });
    });
  });
});

app.post('/1/article/:id/order', jsonParser, function(req, res) {
    var articleId = req.params.id;
    var payment_details = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        redirect_urls: {
            // http://homatw.com/1/post/539eb886e8dbde4b39000007/paid?token=EC-4T17102178173001V&PayerID=QPPLBGBK5ZTVS
            return_url: "http://homatw.com/1/article/"+articleId+"/order/payment",
            cancel_url: "http://homatw.com/1/article/"+articleId+"/order/payment"
        },
        "transactions": [{
            "amount": {
                "total": "49",
                "currency": "TWD"
            },
            "description": "購買教學文章"
        }]
    };

  var workflow = new events.EventEmitter();

  workflow.outcome = {
    success: false,
    errfor: {}
  };

  workflow.on("order", function() {
    paypal.payment.create(payment_details, function(err, payment){
        if (err) {
            console.log(err);
            return res.send(workflow.outcome);
        }

        if (payment) {
            //console.log("Create Payment Response");
            //console.log(payment);
            //Create
            var order = new app.db.orders(
            {
                _buyer: req.user._id,
                _article: articleId,
                payService:"paypal",
                paymentInfo:payment
              });//new a document by post object.
            order.save();
            workflow.outcome.success = true;
            workflow.outcome.data = order;
            return res.send(workflow.outcome);
        }
    });
  });

  return workflow.emit('order');
});

/**
 * GET /1/post/:postId/paid
 */
app.get('/1/article/:id/order/payment', function(req, res, next) {
    var workflow = new events.EventEmitter();
    var userId = req.user._id;
    var articleId = req.params.id;
    //var orders = req.app.db.orders;
    var payerId = req.query.PayerID;//GET /1/article/5426f1605ea278f81c6b5946/order/payment?token=EC-6CD05439BE253094S&PayerID=8UEEH9VWTD7N8
    var paymentId;
    
    //console.log("/1/article/:id/order/payment");

    workflow.outcome = {
      success: false
    };

    //return res.send(workflow.outcome);

    workflow.on('pay', function() {
        app.db.orders
        .findOne({$and:[{_buyer:userId}, {_article:articleId}]})
        .exec(function(err, order) {
            paymentId = order.paymentInfo.id;
            //console.log("paymentId="+paymentId);
            paypal.payment.execute(paymentId, {payer_id: payerId}, function (err, payment) {
                order.update({paymentInfo:payment},function(err, numberAffected, raw){
                    if (err) return handleError(err);
                    //console.log('The number of updated documents was %d', numberAffected);
                    //console.log('The raw response from Mongo was ', raw);
                });
                workflow.outcome.success = true;
                workflow.outcome.data = payment;
                //return res.send(workflow.outcome);
                res.render('index');
              //return workflow.emit('updateCustomer');
            });
        });
    });

    /*
    workflow.on('updateCustomer', function() {
    posts
    .findByIdAndUpdate(postId, { $addToSet: { customers: req.user._id } }, function(err, post) {
      workflow.outcome.success = true;
      return res.send(workflow.outcome);
    });
    });*/

    return workflow.emit('pay');
});

app.post('/1/article', jsonParser, function(req, res) {
  //var model = req.app.db.posts;
  var subject = req.body.subject;;
  var content = req.body.content;
  var workflow = new events.EventEmitter();

  workflow.outcome = {
    success: false,
    errfor: {}
  };
  
  workflow.on("validate", function() {
    //because backbone defines the default value subject: "", content: ""
    if (subject.length === 0)//better than subject === ''
        workflow.outcome.errfor.subject = "必填欄位"; 

    if (content.length === 0)
        workflow.outcome.errfor.content = "必填欄位"; 

    if (Object.keys(workflow.outcome.errfor).length !== 0)
        return res.send(workflow.outcome);
    
    workflow.emit("save");
  });

  workflow.on("save", function() {
    //Create
    var article = new app.db.articles(
    {
      subject: subject,
      content: content,
      _author: req.user._id
    });//new a document by post object.
    article.save();
    workflow.outcome.success = true;
    workflow.outcome.data = article;
    return res.send({ status: article.subject + " was posted."});
  });

  return workflow.emit('validate');
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
