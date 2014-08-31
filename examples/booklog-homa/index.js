/**
 * Module dependencies.
 */

var express = require('../../lib/express');

// Path to our public directory

var pub = __dirname + '/public';

// setup middleware

var app = express();
app.use(express.static(pub));

// Optional since express defaults to CWD/views

app.set('views', __dirname + '/views');

// Set our default template engine to "jade"
// which prevents the need for extensions
// (although you can still mix and match)
app.set('view engine', 'jade');

function User(name, email) {
  this.name = name;
  this.email = email;
}

// Dummy users
var users = [
    new User('tj', 'tj@vision-media.ca')
  , new User('ciaran', 'ciaranj@gmail.com')
  , new User('aaron', 'aaron.heckmann+github@gmail.com')
];

app.get('/', function(req, res){
  res.render('users', { users: users });
});

var posts = [
{title:"Sunday",content:"is nice"},
{title:"Monday",content:"is blue"},
{title:"Tuesday",content:"is sleepy"},
{title:"Wedensday",content:"is boring"},
{title:"Thursday",content:"is soso"},
{title:"Friday",content:"is happy"},
{title:"Saturday",content:"is very happy"}
];
/*var posts = [
{
	title:"Sunday",
    content:"a"
}];*/
var retryCnt = 0;

//parm1:uri
//parm2:callback function(lambda:Take a function as a parameter)
//url routing
/*
app.get('/1/post/',function(req, res){
  //object
  var result = 
  {
  	title:"Test",//equal to "title":"Test",//Key(attribute)-value pairs, key is a string and the 
  	content:"Foo"
  };//This a JSON format and this object represents a topic.
    //Only double quotes are allowed in JSON.

  res.send(result);
});*/

/* all means post&get&put&delete */
//app.all('/',function(req,res){});

/*
app.get('*',function(req,res,next){
	console.log('Count:'+count++);
	console.log(req);
	if (req.headers.host === 'localhost:3000')
		console.log("Access denied");
	else
        next();//keep the following functions.
})*/

app.get('/welcome',function(req, res){
	res.render('index');//Could only send one time.
});

app.get('/download',function(req, res){
	var events = require('events');//class, nodejs default package:http://nodejs.org/api/events.html#events_class_events_eventemitter
    var workflow = new events.EventEmitter();//object

    workflow.outcome = {
    	success:false,
    };

    workflow.on('validate',function(){
       console.log('retryCnt='+retryCnt);
       var password = req.query.password;
       if (retryCnt < 3){
           if (password === '123456')
               workflow.emit('success');//return workflow.emit('success');
           else
               workflow.emit('error');//return workflow.emit('error');
       }
       workflow.emit('response');
    });

    workflow.on('success',function(){
    	retryCnt = 0;
    	workflow.outcome.success =  true;
    	workflow.outcome.redirect = {
    		url:'/post'
    	}
    	//workflow.emit('response');
    });

    workflow.on('error',function(){
    	retryCnt++;
    	workflow.outcome.success =  false;
    	workflow.outcome.retry = retryCnt;
    	//workflow.emit('response');
    });

    workflow.on('response',function(){
    	return res.send(workflow.outcome);
    });

    workflow.emit('validate');//should be after workflow.on(these are settings, settings first)
});

app.get('/post',function(req, res){
	res.render('post',{
		posts:posts
	});
});

app.get('/1/post/',function(req, res){
	res.send(posts);//Could only send one time.
});

app.post('/1/post/',function(req, res){
	//postsCnt++;
	var subject;
    var content;

	console.log(req.body);
	console.log(req.query);

	//== compare values
	//=== compare value & type
	if (typeof(req.body) === "undefined"){//REST console default 使用 query string
		subject = req.query.subject;
	    content = req.query.content;
	}else{
		subject = req.body.subject;
	    content = req.body.content;
	}

	var post = 
	{
	    title:subject,//Key(attribute)-value pairs
	    content:content
	};//This a JSON format and this object represents a topic.
	
	posts.push(post);
    res.send({status:"OK"});
});

//: means a variable.
app.put('/1/post/:postId',function(req, res){
	var id=req.params.postId;
	res.send("Update a post:"+id);
});

app.delete('/1/post/',function(req, res){
	res.send("delete a post");
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
